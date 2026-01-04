import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { trackSMTPUsage } from "@/lib/track-usage";
import { createJoinRequestApprovedEmail, createJoinRequestRejectedEmail } from "@/lib/email-templates";

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

// GET - List pending join requests for the company
export async function GET() {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("company_join_requests")
      .select(`
        id,
        status,
        requested_at,
        user:users(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("company_id", admin.company_id)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject a join request
export async function PATCH(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId, action, rejectionReason } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify request belongs to this company
    const { data: joinRequest } = await supabase
      .from("company_join_requests")
      .select("*, user:users(id, first_name, last_name, email)")
      .eq("id", requestId)
      .eq("company_id", admin.company_id)
      .eq("status", "pending")
      .single();

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // Fetch company name
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", admin.company_id)
      .single();

    const companyName = company?.name || "the company";
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update request status
    const { error: updateError } = await supabase
      .from("company_join_requests")
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: admin.id,
        rejection_reason: action === "reject" ? rejectionReason : null,
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    // If approved, add user to company
    if (action === "approve") {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ company_id: admin.company_id })
        .eq("id", joinRequest.user.id);

      if (userUpdateError) throw userUpdateError;
    }

    // Log audit action
    const { logAdminAction } = await import("@/lib/audit-logs");
    await logAdminAction({
      company_admin_id: admin.id,
      company_id: admin.company_id,
      action: action === "approve" ? "APPROVE_JOIN_REQUEST" : "REJECT_JOIN_REQUEST",
      target_resource: "users",
      target_id: joinRequest.user.id,
      details: {
        request_id: requestId,
        user_name: `${joinRequest.user.first_name} ${joinRequest.user.last_name}`,
        rejection_reason: action === "reject" ? rejectionReason : undefined,
      },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || undefined,
    });

    // Create persistent in-app notification
    const notificationTitle = action === "approve" 
      ? `Welcome to ${companyName}!`
      : `Join request update`;
    
    const notificationMessage = action === "approve"
      ? `Your request to join ${companyName} has been approved. You now have access to company testing sessions.`
      : rejectionReason
        ? `Your request to join ${companyName} was declined. Reason: ${rejectionReason}`
        : `Your request to join ${companyName} was declined.`;

    await supabase.from("user_notifications").insert({
      user_id: joinRequest.user.id,
      type: action === "approve" ? "join_request_approved" : "join_request_rejected",
      title: notificationTitle,
      message: notificationMessage,
      link: "/dashboard",
      metadata: {
        company_id: admin.company_id,
        company_name: companyName,
      },
    });

    const user = joinRequest.user;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    // Send notification email
    const startTime = Date.now();
    let emailSent = false;

    try {
      if (action === "approve") {
        await transporter.sendMail({
          from: fromEmail,
          to: user.email,
          subject: `Welcome to ${companyName}! Your request has been approved`,
          html: createJoinRequestApprovedEmail({
            firstName: user.first_name,
            companyName,
            dashboardUrl: `${baseUrl}/dashboard`,
          }),
        });
      } else {
        // Rejection email
        await transporter.sendMail({
          from: fromEmail,
          to: user.email,
          subject: `Update on your request to join ${companyName}`,
          html: createJoinRequestRejectedEmail({
            firstName: user.first_name,
            companyName,
            rejectionReason,
          }),
        });
      }

      const durationMs = Date.now() - startTime;
      trackSMTPUsage("join_request_notification", durationMs, true);
      emailSent = true;
    } catch (emailError) {
      const durationMs = Date.now() - startTime;
      trackSMTPUsage("join_request_notification", durationMs, false, String(emailError));
      console.error("Error sending notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      action,
      emailSent,
      message:
        action === "approve"
          ? `${user.first_name} ${user.last_name} has been added to your company`
          : `Request from ${user.first_name} ${user.last_name} has been rejected`,
    });
  } catch (error) {
    console.error("Error processing join request:", error);
    return NextResponse.json(
      { error: "Failed to process join request" },
      { status: 500 }
    );
  }
}
