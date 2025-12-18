import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET single team with members
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name, created_at, invite_token")
      .eq("id", id)
      .single();

    if (teamError) throw teamError;

    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", id)
      .order("created_at", { ascending: true });

    if (membersError) throw membersError;

    return NextResponse.json({ ...team, members: members || [] });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// PATCH update team
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .update({ name: name.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE team
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
