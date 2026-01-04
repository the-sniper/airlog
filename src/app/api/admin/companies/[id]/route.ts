import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";

// GET single company with details (super admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("companies")
    .select(`
      *,
      admins:company_admins(
        id,
        role,
        created_at,
        user:users(id, first_name, last_name, email)
      ),
      teams:teams(
        id,
        name,
        invite_token,
        created_at,
        members:team_members(count)
      ),
      sessions:sessions(count),
      users:users(
        id,
        first_name,
        last_name,
        email,
        created_at
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH update company (super admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, is_active, subscription_tier, max_teams, max_sessions_per_month } = body;

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (is_active !== undefined) updates.is_active = is_active;
  if (subscription_tier !== undefined) updates.subscription_tier = subscription_tier;
  if (max_teams !== undefined) updates.max_teams = max_teams;
  if (max_sessions_per_month !== undefined) updates.max_sessions_per_month = max_sessions_per_month;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE company (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
