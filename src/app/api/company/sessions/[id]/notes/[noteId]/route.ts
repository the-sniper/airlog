import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

async function checkAccess(id: string) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!session || session.company_id !== admin.company_id) {
    return { error: "Forbidden", status: 403 };
  }
  return { supabase, admin };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const { id, noteId } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;
  const body = await req.json();
  
  // Verify note belongs to session
  const { data: existingNote } = await supabase
    .from("notes")
    .select("session_id")
    .eq("id", noteId)
    .single();
    
  if (!existingNote || existingNote.session_id !== id) {
     return NextResponse.json({ error: "Note not found in this session" }, { status: 404 });
  }

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
  { params }: { params: { id: string; noteId: string } }
) {
  const { id, noteId } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;
  const admin = access.admin!;

  // Parse the deletions reason from query params
  const url = new URL(req.url);
  const reason = url.searchParams.get("reason");

  // First, fetch the note to preserve its data
  const { data: note, error: fetchError } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();

  if (fetchError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  
  if (note.session_id !== id) {
    return NextResponse.json({ error: "Note does not belong to this session" }, { status: 403 });
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
      // Use company admin info. Assuming deleted_by_admin_id can accept company admin IDs
      deleted_by_admin_id: admin.id,
      deleted_by_email: admin.user.email,
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
