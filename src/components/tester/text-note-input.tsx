"use client";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryLabel } from "@/lib/utils";
import type { Note, NoteCategory } from "@/types";

interface Props { sessionId: string; sceneId: string; testerId: string; sceneName: string; onNoteCreated: (note: Note) => void; }

export function TextNoteInput({ sessionId, sceneId, testerId, sceneName, onNoteCreated }: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<NoteCategory | "auto">("auto");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("");

  async function handleSubmit() {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      let finalCategory: NoteCategory = "other";
      let autoClassified = false;
      if (category === "auto") {
        setStep("Classifying...");
        const classifyRes = await fetch("/api/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        const { category: cat } = await classifyRes.json();
        finalCategory = cat || "other";
        autoClassified = true;
      } else {
        finalCategory = category;
      }
      setStep("Saving...");
      const noteRes = await fetch(`/api/sessions/${sessionId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scene_id: sceneId, tester_id: testerId, raw_transcript: text.trim(), category: finalCategory, auto_classified: autoClassified }) });
      const note = await noteRes.json();
      onNoteCreated(note);
      setText("");
      setStep("");
    } catch { 
      alert("Failed to submit note."); 
    } finally { 
      setIsSubmitting(false); 
      setStep("");
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">Category:</span>
          <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory | "auto")} disabled={isSubmitting}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              <SelectItem value="bug">{getCategoryLabel("bug")}</SelectItem>
              <SelectItem value="feature">{getCategoryLabel("feature")}</SelectItem>
              <SelectItem value="ux">{getCategoryLabel("ux")}</SelectItem>
              <SelectItem value="performance">{getCategoryLabel("performance")}</SelectItem>
              <SelectItem value="other">{getCategoryLabel("other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Textarea 
            placeholder={`Type your feedback for: ${sceneName}`} 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={isSubmitting}
            className="min-h-[180px] flex-1 resize-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border shrink-0">
        <p className="text-xs text-muted-foreground">
          {isSubmitting ? step : `${text.length} characters`}
        </p>
        <Button onClick={handleSubmit} disabled={!text.trim() || isSubmitting} size="sm">
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {isSubmitting ? "Submitting..." : "Submit Note"}
        </Button>
      </div>
    </div>
  );
}
