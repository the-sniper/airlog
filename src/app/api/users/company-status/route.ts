import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";

// GET - Get the current user's company status and join requests
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get user's current company
    const { data: userData } = await supabase
      .from("users")
      .select("company_id, company:companies(id, name, logo_url)")
      .eq("id", user.id)
      .single();

    // Get any pending join requests
    const { data: pendingRequests } = await supabase
      .from("company_join_requests")
      .select(`
        id,
        status,
        requested_at,
        rejection_reason,
        company:companies(id, name, logo_url)
      `)
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false });

    const pendingRequest = pendingRequests?.find(r => r.status === "pending");
    const rejectedRequest = pendingRequests?.find(r => r.status === "rejected");

    return NextResponse.json({
      hasCompany: !!userData?.company_id,
      company: userData?.company || null,
      pendingRequest: pendingRequest || null,
      rejectedRequest: rejectedRequest || null,
    });
  } catch (error) {
    console.error("Error fetching company status:", error);
    return NextResponse.json(
      { error: "Failed to fetch company status" },
      { status: 500 }
    );
  }
}
