import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - List companies that allow join requests (for signup dropdown)
// This is a public endpoint - no auth required
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .eq("allow_join_requests", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
