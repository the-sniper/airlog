import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { noteId: string } }) {
  const { noteId } = params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data } = await supabase.from("notes").update(body).eq("id", noteId).select("*, scene:scenes (*), tester:testers (*)").single();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { noteId: string } }) {
  const { noteId } = params;
  const supabase = createAdminClient();
  await supabase.from("notes").delete().eq("id", noteId);
  return NextResponse.json({ success: true });
}
