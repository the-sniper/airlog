import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// GET single session with full details (company-scoped)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      scenes (
        *,
        poll_questions (*)
      ),
      testers (*),
      notes (
        *,
        tester:testers (*)
      )
    `)
    .eq("id", params.id)
    .eq("company_id", admin.company_id)
    .order("order_index", { referencedTable: "scenes", ascending: true })
    .order("created_at", { referencedTable: "notes", ascending: false })
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH update session (company-scoped)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Verify session belongs to company
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("id", params.id)
    .eq("company_id", admin.company_id)
    .single();

  if (!existingSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, name, description, build_version } = body;

  // Handle status actions
  if (action === "start") {
    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  if (action === "end") {
    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Handle general updates
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (build_version !== undefined) updates.build_version = build_version;

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "No updates provided" }, { status: 400 });
}

// DELETE session (company-scoped)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Verify session belongs to company
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", params.id)
    .eq("company_id", admin.company_id)
    .single();

  if (!existingSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
