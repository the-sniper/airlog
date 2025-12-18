import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Check if invite token is valid and return team info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: team, error } = await supabase
      .from("teams")
      .select("id, name, created_at")
      .eq("invite_token", token)
      .single();

    if (error || !team) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error validating team invite:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

// POST - Register new team member via invite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { first_name, last_name, email } = await req.json();

    // Validate required fields
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find the team by invite token
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("invite_token", token)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Check if email already exists in this team
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, first_name, last_name")
      .eq("team_id", team.id)
      .eq("email", email.trim().toLowerCase())
      .single();

    if (existingMember) {
      // Return the existing member info (they're already registered)
      return NextResponse.json({
        member: existingMember,
        team,
        alreadyRegistered: true,
      });
    }

    // Create new team member
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating team member:", memberError);
      return NextResponse.json(
        { error: "Failed to register" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      member,
      team,
      alreadyRegistered: false,
    });
  } catch (error) {
    console.error("Error registering team member:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}

