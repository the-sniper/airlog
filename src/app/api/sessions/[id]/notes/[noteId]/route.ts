import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const { noteId } = params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("notes")
    .update(body)
    .eq("id", noteId)
    .select("*, scene:scenes (*), tester:testers (*)")
    .single();
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const { noteId } = params;
  const supabase = createAdminClient();

  // Parse the deletion reason from query params
  const url = new URL(req.url);
  const reason = url.searchParams.get("reason");

  // Get current admin
  const admin = await getCurrentAdmin();

  // First, fetch the note to preserve its data
  const { data: note, error: fetchError } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();

  if (fetchError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // If a reason is provided, save to deleted_notes table for audit
  if (reason) {
    const { error: insertError } = await supabase.from("deleted_notes").insert({
      original_note_id: note.id,
      session_id: note.session_id,
      scene_id: note.scene_id,
      tester_id: note.tester_id,
      audio_url: note.audio_url,
      raw_transcript: note.raw_transcript,
      edited_transcript: note.edited_transcript,
      category: note.category,
      deletion_reason: reason,
      deleted_by_admin_id: admin?.id || null,
      deleted_by_email: admin?.email || null,
      original_created_at: note.created_at,
    });

    if (insertError) {
      console.error("Error saving deleted note record:", insertError);
      // Continue with deletion even if audit fails
    }
  }

  // Delete the note
  const { error: deleteError } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
