import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { trackSMTPUsage } from "@/lib/track-usage";
import { notifyUser } from "@/lib/user-system-notifications";

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
        .update({ 
          company_id: admin.company_id,
          join_method: 'admin_add'
        })
        .eq("id", existingUser.id);

      if (updateError) throw updateError;

      // Send notification to the user that they have been added
      await notifyUser({
        userId: existingUser.id,
        type: "company_added",
        title: `You've been added to ${admin.company.name}`,
        message: `You have been added to the company ${admin.company.name}. You can now access company resources.`,
        metadata: {
          companyId: admin.company.id,
          companyName: admin.company.name,
        },
        emailRecipients: [existingUser.email],
      });
      
      // Log audit action
      const { logAdminAction } = await import("@/lib/audit-logs");
      await logAdminAction({
        company_admin_id: admin.id,
        company_id: admin.company_id,
        action: "ADD_EXISTING_USER",
        target_resource: "users",
        target_id: existingUser.id,
        details: {
          user_name: `${existingUser.first_name} ${existingUser.last_name}`,
          method: "direct_add"
        },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || undefined,
      });

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

    // Log audit action - Audit that an invite was sent
    const { logAdminAction } = await import("@/lib/audit-logs");
    await logAdminAction({
      company_admin_id: admin.id,
      company_id: admin.company_id,
      action: "INVITE_USER",
      target_resource: "company_user_invites",
      target_id: invite.id,
      details: {
        invited_email: normalizedEmail,
      },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || undefined,
    });

    // Fetch company name for the email
    const { data: company } = await supabase
      .from("companies")
      .select("name, logo_url")
      .eq("id", admin.company_id)
      .single();

    const companyName = company?.name || "your company";

    // Build invite URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Send email
    const startTime = Date.now();
    let emailSent = false;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: normalizedEmail,
        subject: `You're invited to join ${companyName} on AirLog`,
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #14b8a6; font-size: 24px; margin-bottom: 24px;">Join ${companyName} on AirLog</h1>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You've been invited to join <strong>${companyName}</strong> on AirLog, a platform for
            collecting and managing product feedback.
          </p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background-color: #14b8a6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 14px; color: #374151;">
            ${inviteUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
        `,
      });

      const durationMs = Date.now() - startTime;
      trackSMTPUsage("company_invite", durationMs, true);
      emailSent = true;
    } catch (emailError) {
      const durationMs = Date.now() - startTime;
      trackSMTPUsage("company_invite", durationMs, false, String(emailError));
      console.error("Error sending invite email:", emailError);
      // Don't fail the whole request if email fails - invite is still created
    }

    return NextResponse.json({
      success: true,
      invite,
      emailSent,
      message: emailSent
        ? `Invite sent to ${normalizedEmail}`
        : "Invite created but email failed to send. Share the link manually.",
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// PATCH - Resend/refresh a pending invite
export async function PATCH(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify invite belongs to company
    const { data: invite } = await supabase
      .from("company_user_invites")
      .select("*")
      .eq("id", id)
      .eq("company_id", admin.company_id)
      .eq("status", "pending")
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const { data: updatedInvite, error } = await supabase
      .from("company_user_invites")
      .update({
        token: newToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Fetch company name for the email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", admin.company_id)
      .single();

    const companyName = company?.name || "your company";

    // Build invite URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const inviteUrl = `${baseUrl}/invite/${newToken}`;

    // Send email
    const startTime = Date.now();
    let emailSent = false;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: invite.email,
        subject: `Reminder: You're invited to join ${companyName} on AirLog`,
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #14b8a6; font-size: 24px; margin-bottom: 24px;">Reminder: Join ${companyName} on AirLog</h1>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            This is a reminder that you've been invited to join <strong>${companyName}</strong> on AirLog.
          </p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background-color: #14b8a6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 14px; color: #374151;">
            ${inviteUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
        `,
      });

      const durationMs = Date.now() - startTime;
      trackSMTPUsage("company_invite_resend", durationMs, true);
      emailSent = true;
    } catch (emailError) {
      const durationMs = Date.now() - startTime;
      trackSMTPUsage("company_invite_resend", durationMs, false, String(emailError));
      console.error("Error resending invite email:", emailError);
    }

    return NextResponse.json({
      success: true,
      invite: updatedInvite,
      emailSent,
      message: emailSent
        ? `Invite resent to ${invite.email}`
        : "Invite refreshed but email failed to send.",
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { error: "Failed to resend invite" },
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
