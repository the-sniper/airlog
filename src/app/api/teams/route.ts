import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all teams with members count and company info
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");

    const supabase = await createClient();
    let query = supabase
      .from("teams")
      .select(
        "*, members:team_members(count), company:companies(id, name, slug)",
      )
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}

// Helper to generate invite token
function generateInviteToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST create new team
export async function POST(request: Request) {
  try {
    const { name, company_id } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        invite_token: generateInviteToken(),
        company_id: company_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}
