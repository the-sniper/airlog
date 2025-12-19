import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST add member(s) to team
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: team_id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Handle bulk add from testers
    if (body.testers && Array.isArray(body.testers)) {
      // First, get existing members in this team to avoid duplicates
      const { data: existingMembers } = await supabase
        .from("team_members")
        .select("first_name, last_name")
        .eq("team_id", team_id);

      const existingSet = new Set(
        (existingMembers || []).map(m => 
          `${m.first_name.toLowerCase()}_${m.last_name.toLowerCase()}`
        )
      );

      // Filter out testers that are already team members
      const newMembers = body.testers
        .filter((t: { first_name: string; last_name: string }) => 
          !existingSet.has(`${t.first_name.toLowerCase()}_${t.last_name.toLowerCase()}`)
        )
        .map((t: { first_name: string; last_name: string; email?: string }) => ({
          team_id,
          first_name: t.first_name.trim(),
          last_name: t.last_name.trim(),
          email: t.email?.trim()?.toLowerCase() || null,
        }));

      if (newMembers.length === 0) {
        return NextResponse.json({ 
          data: [], 
          message: "All testers are already members of this team" 
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
