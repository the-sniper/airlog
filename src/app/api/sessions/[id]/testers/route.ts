import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("testers").select("*").eq("session_id", id).order("created_at", { ascending: true });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const supabase = createAdminClient();
  const { data } = await supabase.from("testers").insert({ session_id: id, name, invite_token: generateInviteToken() }).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const testerId = new URL(req.url).searchParams.get("testerId");
  if (!testerId) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const supabase = createAdminClient();
  await supabase.from("testers").delete().eq("id", testerId);
  return NextResponse.json({ success: true });
}
