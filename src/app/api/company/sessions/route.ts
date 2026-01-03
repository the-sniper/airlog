import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// Generate a 6-character uppercase alphanumeric join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET all sessions for the current company
export async function GET() {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, scenes (count), testers (count), notes (count)")
    .eq("company_id", admin.company_id)
    .order("created_at", { ascending: false });
    
  if (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
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

// POST create new session for the current company
export async function POST(req: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, build_version, scenes, issue_options, team_id } = body;
  
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // If team_id is provided, verify it belongs to this company
  if (team_id) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("id", team_id)
      .eq("company_id", admin.company_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }
  }

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
      company_id: admin.company_id,
      team_id: team_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  if (scenes?.length > 0) {
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
