import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Generate a 6-character uppercase alphanumeric join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, scenes (count), testers (count), notes (count)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data);
}

interface PollQuestionInput {
  id?: string;
  question: string;
  question_type: "radio" | "checkbox";
  options: string[];
  required: boolean;
}

interface SceneInput {
  name: string;
  description?: string | null;
  poll_questions?: PollQuestionInput[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, build_version, scenes, issue_options } = body;
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  const supabase = createAdminClient();

  // Generate unique join code
  const join_code = generateJoinCode();

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      name,
      description: description || null,
      build_version: build_version || null,
      status: "draft",
      issue_options: issue_options || [],
      join_code,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  if (scenes?.length > 0) {
    // Support both string[] (legacy) and SceneInput[] (with description and poll_questions)
    const sceneRecords = scenes.map((s: string | SceneInput, i: number) => {
      if (typeof s === "string") {
        return { session_id: session.id, name: s, order_index: i };
      }
      return {
        session_id: session.id,
        name: s.name,
        description: s.description || null,
        order_index: i,
      };
    });
    const { data: insertedScenes } = await supabase
      .from("scenes")
      .insert(sceneRecords)
      .select();

    // Insert poll questions for each scene that has them
    if (insertedScenes) {
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (typeof scene !== "string" && scene.poll_questions?.length > 0) {
          const insertedScene = insertedScenes[i];
          if (insertedScene) {
            const pollQuestionsToInsert = scene.poll_questions.map(
              (q: PollQuestionInput, qIndex: number) => ({
                scene_id: insertedScene.id,
                question: q.question,
                question_type: q.question_type,
                options: q.options,
                required: q.required,
                order_index: qIndex,
              })
            );
            await supabase.from("poll_questions").insert(pollQuestionsToInsert);
          }
        }
      }
    }
  }
  const { data } = await supabase
    .from("sessions")
    .select("*, scenes (*, poll_questions(*))")
    .eq("id", session.id)
    .order("order_index", { referencedTable: "scenes", ascending: true })
    .single();
  return NextResponse.json(data, { status: 201 });
}
