import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const { poll_question_id, tester_id, selected_options } = body;

  if (!poll_question_id || !tester_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Upsert the poll response (update if exists, insert if not)
  const { data, error } = await supabase
    .from("poll_responses")
    .upsert(
      {
        poll_question_id,
        tester_id,
        selected_options: selected_options || [],
      },
      {
        onConflict: "poll_question_id,tester_id",
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save poll response:", error);
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const testerId = new URL(req.url).searchParams.get("testerId");

  const supabase = createAdminClient();

  // Get all poll questions for this session's scenes
  let query = supabase
    .from("poll_responses")
    .select(
      `
      *,
      poll_question:poll_questions!inner(
        *,
        scene:scenes!inner(session_id)
      )
    `,
    )
    .eq("poll_question.scene.session_id", id);

  if (testerId) {
    query = query.eq("tester_id", testerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch poll responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 },
    );
  }

  return NextResponse.json(data || []);
}
