import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const { id: sessionId, noteId } = params;

  try {
    // Fetch the specific note with its scene and session info
    const supabase = createAdminClient();
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*, scene:scenes (*)")
      .eq("id", noteId)
      .eq("session_id", sessionId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const transcript = note.edited_transcript || note.raw_transcript;
    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript available for this note" },
        { status: 400 },
      );
    }

    // Fetch session info for context
    const { data: session } = await supabase
      .from("sessions")
      .select("name, description")
      .eq("id", sessionId)
      .single();

    const sceneName = note.scene?.name || "Unknown Scene";
    const sessionName = session?.name || "Testing Session";

    const prompt = `You are an expert at analyzing user feedback and converting it into actionable development tasks.

Context:
- Session: ${sessionName}
- Scene/Area: ${sceneName}
- Feedback Category: ${note.category}

User Feedback (voice transcription):
"${transcript}"

IMPORTANT INSTRUCTIONS:

1. FIRST, assess the quality of the transcription:
   - Is it clear and understandable?
   - Is it too short or vague to be actionable?
   - Does it appear to be gibberish, garbled speech, or a transcription error?
   - Is it just filler words or incomplete thoughts?

2. IF the transcription is unclear, too short, or doesn't make sense:
   - Be TRANSPARENT about it
   - Start with: "**⚠️ Transcription Quality Issue**"
   - Explain what the issue is (e.g., "The transcription appears to be incomplete/unclear/garbled")
   - If ANY useful information can be extracted, mention it
   - Suggest the user re-record or manually edit the note

3. IF the transcription is clear and actionable:
   - Write the summary from the tester's perspective using first-person language (e.g., "I noticed...", "I found...")
   - Do NOT use third-person language like "The user..." or "The tester..."

Format for CLEAR feedback:
**Summary:** [Brief summary in first person]

**Actionable Items:**
- [Specific task 1]
- [Specific task 2 if needed]

**Notes:** [Any additional context or implementation suggestions]

Format for UNCLEAR feedback:
**⚠️ Transcription Quality Issue**

The transcription [explain the issue - e.g., "appears to be too brief to generate meaningful action items" / "contains unclear or garbled text that may be a transcription error" / "lacks specific details about the feedback"].

[If any partial information can be extracted, mention it here]

**Suggestion:** [Recommend re-recording, editing the note manually, or providing more context]

Be honest and helpful. It's better to acknowledge unclear input than to generate unhelpful or confusing action items.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that converts user testing feedback into clear, actionable development tasks. Be concise and specific.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      summary,
      noteId,
      transcript,
      category: note.category,
      sceneName,
    });
  } catch (error) {
    console.error("Error generating note summary:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key. Please check your configuration." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
