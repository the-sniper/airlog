import { NextRequest, NextResponse } from "next/server";
import { trackWhisperUsage } from "@/lib/track-usage";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File;
  if (!audioFile)
    return NextResponse.json({ error: "Audio required" }, { status: 400 });
  
  const startTime = Date.now();
  try {
    const whisperFormData = new FormData();
    whisperFormData.append("audio_file", audioFile);
    const response = await fetch(
      `${process.env.WHISPER_API_URL || "http://localhost:9000"}/asr`,
      { method: "POST", body: whisperFormData },
    );
    
    const durationMs = Date.now() - startTime;
    
    if (!response.ok) {
      trackWhisperUsage(durationMs, false, "Response not OK");
      return NextResponse.json({
        text: "[Transcription unavailable]",
        confidence: 0,
        words: [],
      });
    }
    
    const result = await response.json();
    trackWhisperUsage(durationMs, true);
    
    return NextResponse.json({
      text: result.text || "",
      confidence: result.confidence || 0.9,
      words: result.words || [],
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    trackWhisperUsage(durationMs, false, String(error));
    return NextResponse.json({
      text: "[Transcription unavailable]",
      confidence: 0,
      words: [],
    });
  }
}
