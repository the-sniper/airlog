"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration, getCategoryLabel } from "@/lib/utils";
import type { Note, NoteCategory } from "@/types";

interface Props {
  sessionId: string;
  sceneId: string;
  testerId: string;
  sceneName: string;
  onNoteCreated: (note: Note) => void;
}
type State = "idle" | "recording" | "paused" | "processing";

export function VoiceRecorder({
  sessionId,
  sceneId,
  testerId,
  sceneName,
  onNoteCreated,
}: Props) {
  const [state, setState] = useState<State>("idle");
  const [duration, setDuration] = useState(0);
  const [category, setCategory] = useState<NoteCategory | "auto">("auto");
  const [step, setStep] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingSceneIdRef = useRef<string>(sceneId);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  async function startRecording() {
    try {
      recordingSceneIdRef.current = sceneId;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.start(1000);
      setState("recording");
      setDuration(0);
      startTimer();
    } catch {
      alert("Could not access microphone.");
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      stopTimer();
    }
  }
  function resumeRecording() {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      startTimer();
    }
  }
  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      stopTimer();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      setState("processing");
      processRecording();
    }
  }
  function cancelRecording() {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    stopTimer();
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    setState("idle");
    setDuration(0);
  }

  async function processRecording() {
    try {
      await new Promise((r) => setTimeout(r, 100));
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setStep("Transcribing...");
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const { text: transcript } = await transcribeRes.json();
      let finalCategory: NoteCategory = "other";
      let autoClassified = false;
      if (category === "auto" && transcript) {
        setStep("Classifying...");
        const classifyRes = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        });
        const { category: cat } = await classifyRes.json();
        finalCategory = cat || "other";
        autoClassified = true;
      } else if (category !== "auto") finalCategory = category;
      setStep("Saving...");
      const noteRes = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene_id: recordingSceneIdRef.current,
          tester_id: testerId,
          raw_transcript: transcript,
          category: finalCategory,
          auto_classified: autoClassified,
        }),
      });
      const note = await noteRes.json();
      const uploadFormData = new FormData();
      uploadFormData.append("audio", blob, "recording.webm");
      uploadFormData.append("sessionId", sessionId);
      uploadFormData.append("noteId", note.id);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch(`/api/sessions/${sessionId}/notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_url: url }),
        });
        note.audio_url = url;
      }
      onNoteCreated(note);
      setState("idle");
      setDuration(0);
      setStep("");
    } catch {
      setState("idle");
      setStep("");
      alert("Failed to process recording.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Category:</span>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as NoteCategory | "auto")}
            disabled={state !== "idle"}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              <SelectItem value="bug">{getCategoryLabel("bug")}</SelectItem>
              <SelectItem value="feature">
                {getCategoryLabel("feature")}
              </SelectItem>
              <SelectItem value="ux">{getCategoryLabel("ux")}</SelectItem>
              <SelectItem value="performance">
                {getCategoryLabel("performance")}
              </SelectItem>
              <SelectItem value="other">{getCategoryLabel("other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {state !== "idle" && state !== "processing" && (
          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      <div className="relative h-28 bg-secondary/30 rounded-2xl flex items-center justify-center overflow-hidden border border-border/30">
        {state === "idle" && (
          <p className="text-sm text-muted-foreground">
            Recording for:{" "}
            <span className="text-foreground/80 font-medium">{sceneName}</span>
          </p>
        )}
        {state === "recording" && (
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full waveform-bar"
                style={{ height: "4px" }}
              />
            ))}
          </div>
        )}
        {state === "paused" && (
          <div className="flex items-center gap-2 text-amber-400">
            <Pause className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-sm font-medium">Paused</span>
          </div>
        )}
        {state === "processing" && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{step}</span>
          </div>
        )}
        {state === "recording" && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 recording-indicator" />
            <span className="text-xs font-medium text-red-400">REC</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {state === "idle" && (
          <Button
            onClick={startRecording}
            size="lg"
            className="rounded-full h-16 w-16 shadow-glow-lg hover:shadow-glow"
          >
            <Mic className="w-6 h-6" strokeWidth={2} />
          </Button>
        )}
        {state === "recording" && (
          <>
            <Button
              onClick={pauseRecording}
              variant="secondary"
              size="lg"
              className="rounded-full h-12 w-12"
            >
              <Pause className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="rounded-full h-16 w-16"
            >
              <Square className="w-6 h-6" strokeWidth={2} />
            </Button>
          </>
        )}
        {state === "paused" && (
          <>
            <Button
              onClick={resumeRecording}
              variant="secondary"
              size="lg"
              className="rounded-full h-12 w-12"
            >
              <Play className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              onClick={stopRecording}
              size="lg"
              className="rounded-full h-16 w-16"
            >
              <Send className="w-6 h-6" strokeWidth={2} />
            </Button>
            <Button onClick={cancelRecording} variant="ghost" size="sm">
              Cancel
            </Button>
          </>
        )}
        {state === "processing" && (
          <Button disabled size="lg" className="rounded-full h-16 w-16">
            <Loader2 className="w-6 h-6 animate-spin" />
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {state === "idle" && "Tap the microphone to start recording"}
        {state === "recording" && "Speak your feedback clearly"}
        {state === "paused" && "Resume or submit your recording"}
        {state === "processing" && "Processing your note..."}
      </p>
    </div>
  );
}
