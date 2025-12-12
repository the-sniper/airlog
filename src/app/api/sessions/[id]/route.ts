import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sessions").select("*, scenes (*), testers (*), notes (*, scene:scenes (*), tester:testers (*))").eq("id", id).order("order_index", { referencedTable: "scenes", ascending: true }).single();
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
