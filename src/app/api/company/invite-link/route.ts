import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

// Helper to generate invite token
function generateInviteToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// GET - Get or create a permanent company invite link
// This creates a special invite without an email that can be used by anyone to join the company
export async function GET() {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Look for an existing permanent invite (no email specified, long expiry)
    const { data: existingInvite } = await supabase
      .from("company_user_invites")
      .select("token")
      .eq("company_id", admin.company_id)
      .eq("status", "pending")
      .is("email", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingInvite) {
      return NextResponse.json({ token: existingInvite.token });
    }

    // Create a new permanent invite
    const token = generateInviteToken();
    const { data: newInvite, error } = await supabase
      .from("company_user_invites")
      .insert({
        company_id: admin.company_id,
        email: null, // No specific email - anyone can use this link
        invited_by: admin.id,
        status: "pending",
        token: token,
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year expiry
      })
      .select("token")
      .single();

    if (error) {
      console.error("Error creating company invite:", error);
      throw error;
    }

    return NextResponse.json({ token: newInvite.token });
  } catch (error) {
    console.error("Error managing company invite link:", error);
    return NextResponse.json(
      { error: "Failed to generate invite link" },
      { status: 500 }
    );
  }
}
