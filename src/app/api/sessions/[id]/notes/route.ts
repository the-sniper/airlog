import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const testerId = new URL(req.url).searchParams.get("testerId");
  const supabase = createAdminClient();
  let query = supabase.from("notes").select("*, scene:scenes (*), tester:testers (*)").eq("session_id", id).order("created_at", { ascending: true });
  if (testerId) query = query.eq("tester_id", testerId);
  const { data } = await query;
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { scene_id, tester_id, audio_url, raw_transcript, category, auto_classified } = body;
  if (!scene_id || !tester_id) return NextResponse.json({ error: "Scene/Tester required" }, { status: 400 });
  const supabase = createAdminClient();
  const { data } = await supabase.from("notes").insert({ session_id: id, scene_id, tester_id, audio_url, raw_transcript, edited_transcript: raw_transcript, category: category || "other", auto_classified: auto_classified || false }).select("*, scene:scenes (*), tester:testers (*)").single();
  return NextResponse.json(data, { status: 201 });
}
