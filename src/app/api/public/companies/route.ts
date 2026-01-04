import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Disable all caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - List companies that allow join requests (for signup dropdown)
// This is a public endpoint - no auth required
export async function GET() {
  try {
    const supabase = createAdminClient();

    console.log("[API] Fetching companies from Supabase...");

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .eq("allow_join_requests", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[API] Supabase error:", error);
      throw error;
    }

    console.log("[API] Companies fetched:", data);

    return NextResponse.json(data || [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
