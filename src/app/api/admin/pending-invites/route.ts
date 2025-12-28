import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";
import nodemailer from "nodemailer";

export interface PendingInvite {
  id: string;
  email: string;
  invite_type: "session" | "team";
  target_id: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * GET /api/admin/pending-invites
 * List pending invites for a session or team
 * Query params:
 *   - type: 'session' | 'team'
 *   - target_id: session_id or team_id
 */
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") as "session" | "team" | null;
  const targetId = searchParams.get("target_id");

  if (!type || !targetId) {
    return NextResponse.json(
      { error: "type and target_id are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("pending_invites")
    .select("*")
    .eq("invite_type", type)
    .eq("target_id", targetId)
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API GET /admin/pending-invites] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/**
 * POST /api/admin/pending-invites
 * Create a pending invite for an unregistered user
 * Body: { email, invite_type: 'session'|'team', target_id }
 *
 * If user is already registered, returns { already_registered: true, user }
 * so the caller can add them directly instead.
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const admin = await getCurrentAdmin();

  const body = await req.json();
  const { email, invite_type, target_id } = body;

  if (!email || !invite_type || !target_id) {
    return NextResponse.json(
      { error: "email, invite_type, and target_id are required" },
      { status: 400 },
    );
  }

  if (invite_type !== "session" && invite_type !== "team") {
    return NextResponse.json(
      { error: "invite_type must be 'session' or 'team'" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user is already registered
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("email", normalizedEmail)
    .single();

  if (existingUser) {
    // User exists - caller should add them directly
    return NextResponse.json({
      already_registered: true,
      user: existingUser,
    });
  }

  // Check if invite already exists
  const { data: existingInvite } = await supabase
    .from("pending_invites")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("invite_type", invite_type)
    .eq("target_id", target_id)
    .is("claimed_at", null)
    .single();

  if (existingInvite) {
    return NextResponse.json(
      { error: "Invite already pending for this email" },
      { status: 409 },
    );
  }

  // Get target name for email
  let targetName = "";
  if (invite_type === "session") {
    const { data: session } = await supabase
      .from("sessions")
      .select("name")
      .eq("id", target_id)
      .single();
    targetName = session?.name || "a testing session";
  } else {
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", target_id)
      .single();
    targetName = team?.name || "a team";
  }

  // Create pending invite
  const { data: invite, error } = await supabase
    .from("pending_invites")
    .insert({
      email: normalizedEmail,
      invite_type,
      target_id,
      invited_by: admin?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[API POST /admin/pending-invites] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send signup invite email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signupUrl = `${baseUrl}/signup?inviteEmail=${encodeURIComponent(normalizedEmail)}`;
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: normalizedEmail,
      subject: `You're invited to join Echo`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f6fc5; font-size: 24px; margin-bottom: 24px;">You've Been Invited!</h1>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You've been invited to join ${invite_type === "session" ? "the testing session" : "the team"}: <strong>${targetName}</strong>
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            To participate, please create an account:
          </p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${signupUrl}" 
               style="display: inline-block; background-color: #4f6fc5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Create Account
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Once you register with this email address, you'll automatically be added to ${targetName}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px;">
            This invitation expires in 7 days.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("[API POST /admin/pending-invites] Email error:", emailError);
    // Don't fail the request if email fails - invite is still created
  }

  return NextResponse.json(invite, { status: 201 });
}

/**
 * DELETE /api/admin/pending-invites?id=xxx
 * Cancel a pending invite
 */
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pending_invites")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[API DELETE /admin/pending-invites] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
