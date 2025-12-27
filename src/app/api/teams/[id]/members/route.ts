import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST add member(s) to team
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: team_id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Handle bulk add from testers or users
    if (body.testers && Array.isArray(body.testers)) {
      // First, get existing members in this team to avoid duplicates
      const { data: existingMembers } = await supabase
        .from("team_members")
        .select("user_id, email")
        .eq("team_id", team_id);

      // Create sets for duplicate checking (by user_id and email)
      const existingUserIds = new Set(
        (existingMembers || [])
          .filter(m => m.user_id)
          .map(m => m.user_id)
      );
      const existingEmails = new Set(
        (existingMembers || [])
          .filter(m => m.email)
          .map(m => m.email.toLowerCase())
      );

      // Filter out members that already exist (by user_id or email)
      const newMembers = body.testers
        .filter((t: { user_id?: string; email?: string }) => {
          // If user_id is provided and exists, skip
          if (t.user_id && existingUserIds.has(t.user_id)) {
            return false;
          }
          // If email is provided and exists, skip
          if (t.email && existingEmails.has(t.email.toLowerCase())) {
            return false;
          }
          return true;
        })
        .map((t: { first_name: string; last_name: string; email?: string; user_id?: string }) => ({
          team_id,
          first_name: t.first_name.trim(),
          last_name: t.last_name.trim(),
          email: t.email?.trim()?.toLowerCase() || null,
          user_id: t.user_id || null,
        }));

      if (newMembers.length === 0) {
        return NextResponse.json({
          data: [],
          message: "All selected users are already members of this team"
        });
      }

      const { data, error } = await supabase
        .from("team_members")
        .insert(newMembers)
        .select();

      if (error) throw error;
      return NextResponse.json({ data, added: data?.length || 0 });
    }

    // Handle single member addition
    const { first_name, last_name, email } = body;

    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        team_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email?.trim()?.toLowerCase() || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}

// GET check which testers are already in this team
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: team_id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("team_members")
      .select("first_name, last_name, email")
      .eq("team_id", team_id);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}
