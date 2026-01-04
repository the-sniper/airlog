import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

interface TesterInput {
  first_name: string;
  last_name: string;
  email?: string | null;
  user_id?: string;
}

// GET - List members of a team (company-scoped)
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

    // Verify team belongs to company
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", params.teamId)
      .eq("company_id", admin.company_id)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", params.teamId)
      .order("first_name", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Add members to a team (company-scoped)
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { testers } = await request.json();

    if (!testers || !Array.isArray(testers) || testers.length === 0) {
      return NextResponse.json(
        { error: "Testers array is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify team belongs to company
    const { data: team } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", params.teamId)
      .eq("company_id", admin.company_id)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get existing members to check for duplicates
    const { data: existingMembers } = await supabase
      .from("team_members")
      .select("user_id, email")
      .eq("team_id", params.teamId);

    const existingUserIds = new Set(
      existingMembers?.map((m) => m.user_id).filter(Boolean) || []
    );
    const existingEmails = new Set(
      existingMembers?.map((m) => m.email?.toLowerCase()).filter(Boolean) || []
    );

    // Filter out duplicates
    const newMembers = testers.filter((t: TesterInput) => {
      if (t.user_id && existingUserIds.has(t.user_id)) return false;
      if (t.email && existingEmails.has(t.email.toLowerCase())) return false;
      return true;
    });

    if (newMembers.length === 0) {
      return NextResponse.json({
        added: 0,
        message: "All selected users are already members of this team",
      });
    }

    // Insert new members
    const membersToInsert = newMembers.map((t: TesterInput) => ({
      team_id: params.teamId,
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email?.toLowerCase() || null,
      user_id: t.user_id || null,
    }));

    const { data, error } = await supabase
      .from("team_members")
      .insert(membersToInsert)
      .select();

    if (error) throw error;

    // Notify added members
    const { notifyUser } = await import("@/lib/user-system-notifications");
    
    // We can only notify users who have a user_id. 
    // If they were added by email only (no user_id), they might be external testers?
    // But usually members have user_id if they are in the system.
    // The insert returns 'data' which should have user_id if it was passed or generated?
    // Actually team_members table usually links users.
    
    await Promise.all(
        (data || []).map(async (member) => {
            if (member.user_id) {
                await notifyUser({
                    userId: member.user_id,
                    type: "team_added",
                    title: "Added to Team",
                    message: `You have been added to the team ${team.name}.`,
                    metadata: { teamName: team.name }
                });
            }
        })
    );

    return NextResponse.json({
      added: data?.length || 0,
      data,
    });
  } catch (error) {
    console.error("Error adding team members:", error);
    return NextResponse.json(
      { error: "Failed to add team members" },
      { status: 500 }
    );
  }
}
