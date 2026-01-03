import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";

// GET teams for a specific company (super admin only)
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
    .from("teams")
    .select("*, members:team_members(count)")
    .eq("company_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST assign team to company (super admin only - for legacy teams)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { team_id } = body;

  if (!team_id) {
    return NextResponse.json({ error: "team_id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify company exists
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", params.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Update team with company_id
  const { data, error } = await supabase
    .from("teams")
    .update({ company_id: params.id })
    .eq("id", team_id)
    .select()
    .single();

  if (error) {
    console.error("Error assigning team to company:", error);
    return NextResponse.json({ error: "Failed to assign team" }, { status: 500 });
  }

  return NextResponse.json(data);
}
