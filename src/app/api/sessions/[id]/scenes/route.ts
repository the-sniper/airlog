import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { PollQuestion } from "@/types";

interface PollQuestionInput {
  question: string;
  question_type: "radio" | "checkbox";
  options: string[];
  required?: boolean;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { name, description, poll_questions } = body;
  if (!name) return NextResponse.json({ error: "Scene name required" }, { status: 400 });
  
  const supabase = createAdminClient();
  
  // Get the current max order_index for this session
  const { data: existingScenes } = await supabase
    .from("scenes")
    .select("order_index")
    .eq("session_id", id)
    .order("order_index", { ascending: false })
    .limit(1);
  
  const nextOrderIndex = existingScenes && existingScenes.length > 0 ? existingScenes[0].order_index + 1 : 0;
  
  const { data, error } = await supabase
    .from("scenes")
    .insert({ session_id: id, name, description: description || null, order_index: nextOrderIndex })
    .select()
    .single();
  
  if (error) return NextResponse.json({ error: "Failed to add scene" }, { status: 500 });
  
  // Add poll questions if provided
  if (poll_questions && poll_questions.length > 0) {
    const pollQuestionsToInsert = poll_questions.map((q: PollQuestionInput, index: number) => ({
      scene_id: data.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      order_index: index,
      required: q.required || false,
    }));
    
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { sceneId, name, description, poll_questions } = body;
  if (!sceneId) return NextResponse.json({ error: "Scene ID required" }, { status: 400 });
  
  const supabase = createAdminClient();
  const updateData: { name?: string; description?: string | null } = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description || null;
  
  const { data, error } = await supabase
    .from("scenes")
    .update(updateData)
    .eq("id", sceneId)
    .eq("session_id", id)
    .select()
    .single();
  
  if (error) return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  
  // Update poll questions if provided
  if (poll_questions !== undefined) {
    // Delete existing poll questions for this scene
    await supabase.from("poll_questions").delete().eq("scene_id", sceneId);
    
    // Insert new poll questions
    if (poll_questions && poll_questions.length > 0) {
      const pollQuestionsToInsert = poll_questions.map((q: PollQuestionInput, index: number) => ({
        scene_id: sceneId,
        question: q.question,
        question_type: q.question_type,
        options: q.options,
        order_index: index,
        required: q.required || false,
      }));
      
      await supabase.from("poll_questions").insert(pollQuestionsToInsert);
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const sceneId = new URL(req.url).searchParams.get("sceneId");
  if (!sceneId) return NextResponse.json({ error: "Scene ID required" }, { status: 400 });
  
  const supabase = createAdminClient();
  await supabase.from("scenes").delete().eq("id", sceneId).eq("session_id", params.id);
  return NextResponse.json({ success: true });
}
