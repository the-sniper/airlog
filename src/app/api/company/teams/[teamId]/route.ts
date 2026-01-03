import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// GET single team with members (company-scoped)
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*, members:team_members(*)")
      .eq("id", params.teamId)
      .eq("company_id", admin.company_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH update team (company-scoped)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify team belongs to company
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("id", params.teamId)
      .eq("company_id", admin.company_id)
      .single();

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("teams")
      .update({ name: name.trim() })
      .eq("id", params.teamId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE team (company-scoped)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Verify team belongs to company
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("id", params.teamId)
      .eq("company_id", admin.company_id)
      .single();

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", params.teamId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
