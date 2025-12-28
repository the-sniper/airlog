import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FilterParams {
  category?: string;
  sceneId?: string;
  testerId?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    // Parse optional filter parameters from request body
    let filters: FilterParams = {};
    try {
      const body = await req.json();
      filters = {
        category: body.category,
        sceneId: body.sceneId,
        testerId: body.testerId,
      };
    } catch {
      // No body or invalid JSON - that's fine, use no filters
    }

    // Fetch session with notes
    const supabase = createAdminClient();
    const { data: session, error } = await supabase
      .from("sessions")
      .select(
        "*, scenes (*), testers (*), notes (*, scene:scenes (*), tester:testers (*))",
      )
      .eq("id", id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.notes || session.notes.length === 0) {
      return NextResponse.json(
        { error: "No notes to summarize" },
        { status: 400 },
      );
    }

    // Apply filters if provided
    let filteredNotes = session.notes;
    const hasFilters = filters.category || filters.sceneId || filters.testerId;

    if (hasFilters) {
      filteredNotes = session.notes.filter(
        (note: { category: string; scene_id: string; tester_id: string }) => {
          if (filters.category && note.category !== filters.category)
            return false;
          if (filters.sceneId && note.scene_id !== filters.sceneId)
            return false;
          if (filters.testerId && note.tester_id !== filters.testerId)
            return false;
          return true;
        },
      );
    }

    if (filteredNotes.length === 0) {
      return NextResponse.json(
        { error: "No notes match the selected filters" },
        { status: 400 },
      );
    }

    // Get unique testers and scenes for context (from filtered notes)
    const testerNames = Array.from(
      new Set(
        filteredNotes.map(
          (note: {
            tester?: { first_name: string; last_name: string } | null;
          }) =>
            note.tester
              ? `${note.tester.first_name} ${note.tester.last_name}`
              : "Unknown",
        ),
      ),
    );
    const sceneNames = Array.from(
      new Set(
        filteredNotes.map(
          (note: { scene?: { name: string } | null }) =>
            note.scene?.name || "Unknown",
        ),
      ),
    );

    // Format notes for the AI prompt
    const notesText = filteredNotes
      .map(
        (note: {
          category: string;
          scene?: { name: string } | null;
          tester?: { first_name: string; last_name: string } | null;
          edited_transcript: string | null;
          raw_transcript: string | null;
        }) => {
          const transcript =
            note.edited_transcript || note.raw_transcript || "";
          const sceneName = note.scene?.name || "Unknown Scene";
          const testerName = note.tester
            ? `${note.tester.first_name} ${note.tester.last_name}`
            : "Unknown Tester";
          return `[Category: ${note.category.toUpperCase()}] [Scene: ${sceneName}] [Tester: ${testerName}]\n"${transcript}"`;
        },
      )
      .join("\n\n");

    // Build filter context for the prompt if filters are applied
    const filterContext = hasFilters
      ? `\nNote: This summary is based on filtered notes (${filteredNotes.length} of ${session.notes.length} total notes).`
      : "";

    const prompt = `You are an expert at analyzing user feedback and testing notes. Based on the following testing session notes, create a list of actionable items that the development team can work on.

Session: ${session.name}
${session.description ? `Description: ${session.description}` : ""}${filterContext}

Testers: ${testerNames.join(", ")}
Scenes: ${sceneNames.join(", ")}

Testing Notes (voice transcriptions):
${notesText}

Please analyze these notes and provide a structured summary with actionable items.

IMPORTANT - HANDLING TRANSCRIPTION QUALITY:
1. These are voice transcriptions which may contain:
   - Unclear or garbled text from transcription errors
   - Incomplete sentences or filler words
   - Gibberish that doesn't make sense

2. For notes with feedback - INCLUDE them in actionable items:
   - Most notes should be included, even if brief or general
   - "Vague" feedback is still useful - include it with the context provided
   - Subjective observations are valid feedback (e.g., "felt confusing", "didn't feel right")
   - Notes that mention a problem OR a positive observation should be included
   - Write from the tester's perspective using first-person language (e.g., "I noticed...", "I found...")

3. ONLY flag notes in "⚠️ Notes Requiring Review" if they are TRULY UNUSABLE:
   - Obvious test phrases (e.g., "testing 1 2 3", "hello hello")
   - Actually garbled/incomprehensible transcription errors
   - Complete gibberish with no discernible meaning
   - Empty or near-empty content
   
   Do NOT flag notes just because they:
   - Could be "more specific" or "more detailed"
   - Are brief or concise
   - Express general feelings without technical specifics
   - Are subjective observations

FORMATTING REQUIREMENTS:
1. For each actionable item, include:
   - The scene/area it relates to in brackets
   - The feedback written from first-person perspective
   - The tester name who reported it

2. Group similar issues together but maintain attribution.

3. Do NOT include category tags like [Bug], [Feature], [UX], etc. - just describe the actionable items plainly.

Format your response as:

**Summary:**
Brief 2-3 sentence overview of the key findings. If many notes are unclear, mention this.

**Actionable Items:**
- [Scene Name]: Description of the actionable item from first-person perspective (Reported by: Tester Name)
- [Scene Name]: Another actionable item (Reported by: Tester Name)

**Notes:** (optional - any additional context or patterns observed)

**⚠️ Notes Requiring Review:** (ONLY include if there are truly unusable notes - test phrases, gibberish, or garbled transcriptions)
- [Scene] - [Tester Name]: "[Brief quote of the unusable note]" - Issue: [Explain why]

IMPORTANT: Be generous with including notes as actionable items. Most tester feedback, even if brief or general, provides useful signal. Only flag notes that are literally unusable (test phrases, gibberish, transcription errors). Do NOT flag notes just for being "vague" - vague feedback is still feedback.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that specializes in analyzing user testing feedback and creating actionable development tasks. Be concise but thorough.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const summary = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      summary,
      notesCount: filteredNotes.length,
      totalNotesCount: session.notes.length,
      sessionName: session.name,
      filtered: hasFilters,
    });
  } catch (error) {
    console.error("Error generating summary:", error);

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
