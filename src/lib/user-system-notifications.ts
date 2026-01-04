import { createAdminClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export type UserSystemNotificationType =
  | "account_disabled"
  | "account_enabled"
  | "team_added"
  | "team_removed"
  | "company_added"
  | "company_removed";

interface NotifyUserParams {
  userId: string;
  type: UserSystemNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  emailRecipients?: string[]; // If explicitly provided, otherwise fetched from user
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

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function notifyUser(params: NotifyUserParams) {
  try {
    const supabase = createAdminClient();

    // 1. Insert In-App Notification
    const { error: dbError } = await supabase
      .from("user_notifications")
      .insert({
        user_id: params.userId,
        // Map system types to DB types if needed, or use generic 'info'/'alert'
        // Assuming current schema supports a 'type' column or we shove it in metadata
        // Looking at typical migrations, there is usually type/title/message.
        // We'll use the params directly.
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: {
          ...params.metadata,
          system_type: params.type,
        },
        read: false,
      });

    if (dbError) {
      console.error("[UserNotification] DB Insert Failed:", dbError);
    }

    // 2. Send Email
    // Fetch user email if not provided
    let emailTo = params.emailRecipients?.[0];
    let firstName = "User";

    if (!emailTo) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("email, first_name")
        .eq("id", params.userId)
        .single();

      if (userError || !user) {
        console.error("[UserNotification] User fetch failed:", userError);
        return;
      }
      emailTo = user.email;
      firstName = user.first_name || "User";
    }

    if (!emailTo) return;

    const emailHtml = getEmailHtml(params.type, firstName, params);
    const subject = getEmailSubject(params.type, params);

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: emailTo,
      subject: subject,
      html: emailHtml,
    });

    console.log(`[UserNotification] Sent ${params.type} to ${emailTo}`);

  } catch (error) {
    console.error("[UserNotification] Failed:", error);
  }
}

function getEmailSubject(type: UserSystemNotificationType, params: NotifyUserParams): string {
  switch (type) {
    case "account_disabled":
      return "Your account has been disabled";
    case "account_enabled":
      return "Your account has been reactivated";
    case "team_added":
      return `You've been added to ${params.metadata?.teamName || "a team"}`;
    case "team_removed":
      return `You've been removed from ${params.metadata?.teamName || "a team"}`;
    case "company_added":
      return `You've been added to ${params.metadata?.companyName || "a company"}`;
    case "company_removed":
      return `You've been removed from ${params.metadata?.companyName || "a company"}`;
    default:
      return "Notification from AirLog";
  }
}

function getEmailHtml(type: UserSystemNotificationType, firstName: string, params: NotifyUserParams): string {
  const containerStyle = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151;";
  const headerStyle = "font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827;";
  const pStyle = "font-size: 16px; line-height: 1.6; margin-bottom: 16px;";
  const btnStyle = "display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;";
  const footerStyle = "font-size: 12px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;";

  let content = "";
  let actionBtn = "";

  switch (type) {
    case "account_disabled":
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">Your account on AirLog has been disabled by an administrator.</p>
        <p style="${pStyle}">If you believe this is an error, please contact your company administrator or support.</p>
      `;
      break;
    case "account_enabled":
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">Good news! Your account on AirLog has been reactivated.</p>
        <p style="${pStyle}">You can now log in and access your workspace.</p>
      `;
      actionBtn = `
        <div style="margin: 24px 0;">
          <a href="${BASE_URL}/login" style="${btnStyle}">Log In</a>
        </div>
      `;
      break;
    case "team_added":
      const addedTeam = params.metadata?.teamName || "a team";
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">You have been added to the team <strong>${addedTeam}</strong>.</p>
        <p style="${pStyle}">You can now access projects and sessions associated with this team.</p>
      `;
      actionBtn = `
        <div style="margin: 24px 0;">
          <a href="${BASE_URL}" style="${btnStyle}">View Team</a>
        </div>
      `;
      break;
    case "team_removed":
      const removedTeam = params.metadata?.teamName || "a team";
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">You have been removed from the team <strong>${removedTeam}</strong>.</p>
        <p style="${pStyle}">You no longer have access to this team's resources.</p>
      `;
      break;
    case "company_added":
      const companyName = params.metadata?.companyName || "a company";
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">You have been added to the company <strong>${companyName}</strong>.</p>
        <p style="${pStyle}">You can now access company resources and collaborate with your team.</p>
      `;
      actionBtn = `
        <div style="margin: 24px 0;">
          <a href="${BASE_URL}" style="${btnStyle}">Go to Dashboard</a>
        </div>
      `;
      break;
    case "company_removed":
      const removedCompanyName = params.metadata?.companyName || "a company";
      content = `
        <p style="${pStyle}">Hello ${firstName},</p>
        <p style="${pStyle}">You have been removed from the company <strong>${removedCompanyName}</strong>.</p>
        <p style="${pStyle}">You no longer have access to this company's resources.</p>
      `;
      break;
  }

  return `
    <div style="${containerStyle}">
      <h1 style="${headerStyle}">${getEmailSubject(type, params)}</h1>
      ${content}
      ${actionBtn}
      <div style="${footerStyle}">
        <p>AirLog Platform</p>
      </div>
    </div>
  `;
}
