import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET - Get company invite details by token (public endpoint for signup flow)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get invite with company info
    const { data: invite, error } = await supabase
      .from("company_user_invites")
      .select(`
        id,
        email,
        status,
        expires_at,
        company:companies(
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq("token", params.token)
      .eq("status", "pending")
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invite not found or expired" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      email: invite.email,
      company: invite.company,
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}
