import { NextRequest, NextResponse } from "next/server";
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

// GET - List pending invites for the company
export async function GET() {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("company_user_invites")
      .select("*")
      .eq("company_id", admin.company_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST - Create an invite for a user to join the company
export async function POST(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user already exists and belongs to a company
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, company_id, first_name, last_name, email")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      // User exists
      if (existingUser.company_id === admin.company_id) {
        return NextResponse.json({
          already_member: true,
          user: existingUser,
          message: "User is already a member of your company",
        });
      }

      if (existingUser.company_id) {
        return NextResponse.json(
          { error: "User already belongs to another company" },
          { status: 409 }
        );
      }

      // User exists without company - add them directly
      const { error: updateError } = await supabase
        .from("users")
        .update({ company_id: admin.company_id })
        .eq("id", existingUser.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        already_registered: true,
        user: existingUser,
        message: "User added to your company",
      });
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from("company_user_invites")
      .select("id")
      .eq("company_id", admin.company_id)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite is already pending for this email" },
        { status: 409 }
      );
    }

    // Create new invite
    const token = generateInviteToken();
    const { data: invite, error } = await supabase
      .from("company_user_invites")
      .insert({
        company_id: admin.company_id,
        email: normalizedEmail,
        invited_by: admin.id,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      invite,
      message: "Invite created. User will be added when they register.",
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending invite
export async function DELETE(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify invite belongs to company
    const { data: invite } = await supabase
      .from("company_user_invites")
      .select("id")
      .eq("id", inviteId)
      .eq("company_id", admin.company_id)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("company_user_invites")
      .delete()
      .eq("id", inviteId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}
