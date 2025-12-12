import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sessions").select("*, scenes (count), testers (count), notes (count)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data);
}

interface SceneInput {
  name: string;
  description?: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, build_version, scenes } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const supabase = createAdminClient();
  const { data: session, error } = await supabase.from("sessions").insert({ name, description: description || null, build_version: build_version || null, status: "draft" }).select().single();
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  if (scenes?.length > 0) {
    // Support both string[] (legacy) and SceneInput[] (with description)
    const sceneRecords = scenes.map((s: string | SceneInput, i: number) => {
      if (typeof s === 'string') {
        return { session_id: session.id, name: s, order_index: i };
      }
      return { session_id: session.id, name: s.name, description: s.description || null, order_index: i };
    });
    await supabase.from("scenes").insert(sceneRecords);
  }
  const { data } = await supabase.from("sessions").select("*, scenes (*)").eq("id", session.id).order("order_index", { referencedTable: "scenes", ascending: true }).single();
  return NextResponse.json(data, { status: 201 });
}
