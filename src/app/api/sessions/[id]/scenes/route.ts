import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { PollQuestion } from "@/types";

interface PollQuestionInput {
  id?: string;
  question: string;
  question_type: "radio" | "checkbox";
  options: string[];
  required?: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await req.json();
  const { name, description, poll_questions } = body;
  if (!name)
    return NextResponse.json({ error: "Scene name required" }, { status: 400 });

  const supabase = createAdminClient();

  // Get the current max order_index for this session
  const { data: existingScenes } = await supabase
    .from("scenes")
    .select("order_index")
    .eq("session_id", id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrderIndex =
    existingScenes && existingScenes.length > 0
      ? existingScenes[0].order_index + 1
      : 0;

  const { data, error } = await supabase
    .from("scenes")
    .insert({
      session_id: id,
      name,
      description: description || null,
      order_index: nextOrderIndex,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: "Failed to add scene" }, { status: 500 });

  // Add poll questions if provided
  if (poll_questions && poll_questions.length > 0) {
    const pollQuestionsToInsert = poll_questions.map(
      (q: PollQuestionInput, index: number) => ({
        scene_id: data.id,
        question: q.question,
        question_type: q.question_type,
        options: q.options,
        order_index: index,
        required: q.required || false,
      }),
    );

    await supabase.from("poll_questions").insert(pollQuestionsToInsert);
  }

  // Fetch the scene with poll questions
  const { data: sceneWithQuestions } = await supabase
    .from("scenes")
    .select("*, poll_questions(*)")
    .eq("id", data.id)
    .single();

  return NextResponse.json(sceneWithQuestions || data, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await req.json();
  const { sceneId, name, description, poll_questions, order_index } = body;
  if (!sceneId)
    return NextResponse.json({ error: "Scene ID required" }, { status: 400 });

  const supabase = createAdminClient();
  const updateData: {
    name?: string;
    description?: string | null;
    order_index?: number;
  } = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description || null;
  if (order_index !== undefined) updateData.order_index = order_index;

  const { data, error } = await supabase
    .from("scenes")
    .update(updateData)
    .eq("id", sceneId)
    .eq("session_id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json(
      { error: "Failed to update scene" },
      { status: 500 },
    );

  // Update poll questions if provided
  if (poll_questions !== undefined) {
    // Get existing poll questions to determine what to delete
    const { data: existingQuestions } = await supabase
      .from("poll_questions")
      .select("id")
      .eq("scene_id", sceneId);

    const existingIds = new Set(existingQuestions?.map((q) => q.id) || []);
    const inputIds = new Set(
      poll_questions
        .filter((q: PollQuestionInput) => q.id && existingIds.has(q.id))
        .map((q: PollQuestionInput) => q.id)
    );

    // Prepare upsert data
    const pollQuestionsToUpsert = poll_questions.map(
      (q: PollQuestionInput, index: number) => {
        // Base object
        const base = {
          scene_id: sceneId,
          question: q.question,
          question_type: q.question_type,
          options: q.options,
          order_index: index,
          required: q.required || false,
        };

        // For existing, allow ID to be passed for update
        // For new, we can let DB trigger handle ID or pass the client one if we want.
        // If we pass the client generated ID for new ones, it acts as an insert.
        // To be safe and let Supabase/Postgres handle ID generation for completely new rows if needed (though client sends UUID usually),
        // we can include ID if provided.
        return q.id ? { ...base, id: q.id } : base;
      }
    );

    // Upsert (Update existing, Insert new)
    const { error: upsertError } = await supabase
      .from("poll_questions")
      .upsert(pollQuestionsToUpsert); // upsert matches on primary key 'id'

    if (upsertError) {
      console.error("Error upserting poll questions:", upsertError);
      return NextResponse.json(
        { error: "Failed to update poll questions" },
        { status: 500 }
      );
    }

    // Delete questions that are no longer present
    const idsToDelete = Array.from(existingIds).filter((id) => !inputIds.has(id as string));

    if (idsToDelete.length > 0) {
      await supabase
        .from("poll_questions")
        .delete()
        .in("id", idsToDelete);
    }
  }

  // Fetch the scene with poll questions
  const { data: sceneWithQuestions } = await supabase
    .from("scenes")
    .select("*, poll_questions(*)")
    .eq("id", sceneId)
    .single();

  return NextResponse.json(sceneWithQuestions || data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await req.json();
  const { sceneIds } = body; // Array of scene IDs in the new order

  if (!Array.isArray(sceneIds)) {
    return NextResponse.json(
      { error: "sceneIds array required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Update order_index for all scenes
  const updates = sceneIds.map((sceneId: string, index: number) => ({
    id: sceneId,
    order_index: index,
  }));

  // Perform updates in parallel
  const updatePromises = updates.map((update) =>
    supabase
      .from("scenes")
      .update({ order_index: update.order_index })
      .eq("id", update.id)
      .eq("session_id", id),
  );

  await Promise.all(updatePromises);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const sceneId = new URL(req.url).searchParams.get("sceneId");
  if (!sceneId)
    return NextResponse.json({ error: "Scene ID required" }, { status: 400 });

  const supabase = createAdminClient();
  await supabase
    .from("scenes")
    .delete()
    .eq("id", sceneId)
    .eq("session_id", params.id);
  return NextResponse.json({ success: true });
}
