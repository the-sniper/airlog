import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/public/pending-invite-info
 * Get information about a pending invite by email
 * Returns company info if the invite is for a session/team that belongs to a company
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createAdminClient();

  try {
    // Look for pending invites for this email
    const { data: pendingInvites } = await supabase
      .from("pending_invites")
      .select("*")
      .eq("email", normalizedEmail)
      .is("claimed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!pendingInvites || pendingInvites.length === 0) {
      return NextResponse.json({ 
        hasInvite: false,
        company: null 
      });
    }

    const invite = pendingInvites[0];
    let companyInfo = null;
    let targetName = null;

    if (invite.invite_type === "session") {
      // Get session and its company
      const { data: session } = await supabase
        .from("sessions")
        .select("name, company_id, company:companies(id, name, logo_url)")
        .eq("id", invite.target_id)
        .single();

      if (session) {
        targetName = session.name;
        companyInfo = session.company;
      }
    } else if (invite.invite_type === "team") {
      // Get team and its company
      const { data: team } = await supabase
        .from("teams")
        .select("name, company_id, company:companies(id, name, logo_url)")
        .eq("id", invite.target_id)
        .single();

      if (team) {
        targetName = team.name;
        companyInfo = team.company;
      }
    }

    return NextResponse.json({
      hasInvite: true,
      inviteType: invite.invite_type,
      targetName,
      company: companyInfo,
    });
  } catch (error) {
    console.error("Error fetching pending invite info:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite info" },
      { status: 500 }
    );
  }
}
