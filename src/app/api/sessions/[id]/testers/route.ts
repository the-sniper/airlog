import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("testers").select("*").eq("session_id", id).order("created_at", { ascending: true });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  // Handle bulk add from team members
  if (body.members && Array.isArray(body.members)) {
    const testersToInsert = body.members.map((member: { first_name: string; last_name: string; email?: string }) => ({
      session_id: id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email?.toLowerCase() || null,
      invite_token: generateInviteToken(),
    }));

    const { data, error } = await supabase.from("testers").insert(testersToInsert).select();
    if (error) {
      console.error("[API POST /testers] Bulk insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Handle single individual tester
  const { first_name, last_name, email } = body;
  if (!first_name || !last_name) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("testers")
    .insert({
      session_id: id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email?.trim().toLowerCase() || null,
      invite_token: generateInviteToken(),
    })
    .select()
    .single();

  if (error) {
    console.error("[API POST /testers] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const testerId = new URL(req.url).searchParams.get("testerId");
  if (!testerId) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const supabase = createAdminClient();
  await supabase.from("testers").delete().eq("id", testerId);
  return NextResponse.json({ success: true });
}
