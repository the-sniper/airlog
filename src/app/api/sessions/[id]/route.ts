import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Generate a random share token
function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sessions").select("*, scenes (*, poll_questions (*)), testers (*), notes (*, scene:scenes (*), tester:testers (*))").eq("id", id).order("order_index", { referencedTable: "scenes", ascending: true }).single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const supabase = createAdminClient();
  if (body.action === "start") {
    const { data, error } = await supabase.from("sessions").update({ status: "active", started_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  if (body.action === "end") {
    const { data, error } = await supabase.from("sessions").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  if (body.action === "restart") {
    // Restart a completed session - set status back to active
    const { data, error } = await supabase.from("sessions").update({ status: "active", ended_at: null }).eq("id", id).eq("status", "completed").select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  if (body.action === "generate_share_token") {
    // Generate a new share token for the session
    const shareToken = generateShareToken();
    const { data, error } = await supabase.from("sessions").update({ share_token: shareToken }).eq("id", id).eq("status", "completed").select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  if (body.action === "remove_share_token") {
    // Remove the share token (disable public sharing)
    const { data, error } = await supabase.from("sessions").update({ share_token: null }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const { data, error } = await supabase.from("sessions").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createAdminClient();
  await supabase.from("sessions").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
