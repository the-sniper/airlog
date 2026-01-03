import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Generate a random share token
function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "*, scenes (*, poll_questions (*)), testers (*), notes (*, scene:scenes (*), tester:testers (*))"
    )
    .eq("id", id)
    .order("order_index", { referencedTable: "scenes", ascending: true })
    .single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;
  const body = await req.json();

  if (body.action === "start") {
    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "end") {
    // First fetch the session to check if first_ended_at is already set
    const { data: session } = await supabase
      .from("sessions")
      .select("first_ended_at")
      .eq("id", id)
      .single();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status: "completed",
      ended_at: now,
    };
    // Only set first_ended_at if this is the first time ending the session
    if (!session?.first_ended_at) {
      updateData.first_ended_at = now;
    }
    const { data, error } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "restart") {
    // Restart a completed session - set status back to active, track restart
    const { data: session } = await supabase
      .from("sessions")
      .select("restart_count")
      .eq("id", id)
      .single();
    const currentCount = session?.restart_count ?? 0;
    const { data, error } = await supabase
      .from("sessions")
      .update({
        status: "active",
        ended_at: null,
        last_restarted_at: new Date().toISOString(),
        restart_count: currentCount + 1,
      })
      .eq("id", id)
      .eq("status", "completed")
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "generate_share_token") {
    // Generate a new share token for the session
    const shareToken = generateShareToken();
    const { data, error } = await supabase
      .from("sessions")
      .update({ share_token: shareToken })
      .eq("id", id)
      .eq("status", "completed")
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "remove_share_token") {
    // Remove the share token (disable public sharing)
    const { data, error } = await supabase
      .from("sessions")
      .update({ share_token: null })
      .eq("id", id)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Handle generic updates - Allowlisting safe fields
  const safeUpdates: Record<string, unknown> = {};
  const allowedFields = ["name", "description", "build_version", "issue_options", "ai_summary", "status"]; // Added ai_summary/status if strictly needed, but let's stick to core
  // Actually, allow generic updates but exclude sensitive ones like company_id
  const blockedFields = ["id", "company_id", "created_at", "updated_at"];
  
  Object.keys(body).forEach(key => {
    if (!blockedFields.includes(key)) {
       safeUpdates[key] = body[key];
    }
  });

  if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status as number });

  const supabase = access.supabase!;
  await supabase.from("sessions").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
