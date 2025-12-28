import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File;
  if (!audioFile)
    return NextResponse.json({ error: "Audio required" }, { status: 400 });
  try {
    const whisperFormData = new FormData();
    whisperFormData.append("audio_file", audioFile);
    const response = await fetch(
      `${process.env.WHISPER_API_URL || "http://localhost:9000"}/asr`,
      { method: "POST", body: whisperFormData },
    );
    if (!response.ok)
      return NextResponse.json({
        text: "[Transcription unavailable]",
        confidence: 0,
        words: [],
      });
    const result = await response.json();
    return NextResponse.json({
      text: result.text || "",
      confidence: result.confidence || 0.9,
      words: result.words || [],
    });
  } catch {
    return NextResponse.json({
      text: "[Transcription unavailable]",
      confidence: 0,
      words: [],
    });
  }
}
