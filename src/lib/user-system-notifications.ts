import { createAdminClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { createBaseEmail, createParagraph, createButton, createDivider, createTinyText, createRolePromotionEmail, createRoleDemotionEmail, createJoinRequestApprovedEmail } from "@/lib/email-templates";

export type UserSystemNotificationType =
  | "account_disabled"
  | "account_enabled"
  | "team_added"
  | "team_removed"
  | "company_added"
  | "team_removed"
  | "company_added"
  | "company_removed"
  | "role_updated"
  | "join_request_approved";

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

    if (!emailTo) return;

    const emailHtml = getEmailHtml(params.type, firstName, params, emailTo);
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
    case "role_updated":
      const { newRole, companyName } = params.metadata || {};
      if (newRole === 'user') return `Role updated at ${companyName || 'your company'}`;
      // Logic to determine if promotion or not is hard here without old role, but usually upgrade/downgrade messages differ.
      // We'll use a generic one or "You've been promoted" if checkable.
      // Simply: "Your role has been updated at [Company]" is safe, but template has "You're now an Owner!".
      // Template sets its own Heading.
      // Subject should be consistent.
      return `Your role has been updated at ${companyName || 'your company'}`;
    case "join_request_approved":
      return `Welcome to ${params.metadata?.companyName || "the company"}!`;
    default:
      return "Notification from AirLog";
  }
}

function getEmailHtml(type: UserSystemNotificationType, firstName: string, params: NotifyUserParams, emailTo: string): string {
  let body = "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;

  switch (type) {
    case "account_disabled":
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph('Your account on AirLog has been disabled by an administrator.')}
        ${createParagraph('If you believe this is an error, please contact your company administrator or support.')}
      `;
      break;
    case "account_enabled":
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph('Good news! Your account on AirLog has been reactivated.')}
        ${createParagraph('You can now log in and access your workspace.')}
        ${createButton('Log In', `${BASE_URL}/login`)}
      `;
      break;
    case "team_added":
      const addedTeam = params.metadata?.teamName || "a team";
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph(`You have been added to the team <strong>${addedTeam}</strong>.`)}
        ${createParagraph('You can now access projects and sessions associated with this team.')}
        ${createButton('View Team', BASE_URL)}
      `;
      break;
    case "team_removed":
      const removedTeam = params.metadata?.teamName || "a team";
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph(`You have been removed from the team <strong>${removedTeam}</strong>.`)}
        ${createParagraph('You no longer have access to this team\'s resources.')}
      `;
      break;
    case "company_added":
      const companyName = params.metadata?.companyName || "a company";
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph(`You have been added to the company <strong>${companyName}</strong>.`)}
        ${createParagraph('You can now access company resources and collaborate with your team.')}
        ${createButton('Go to Dashboard', BASE_URL)}
      `;
      break;
    case "company_removed":
      const removedCompanyName = params.metadata?.companyName || "a company";
      body = `
        ${createParagraph(`Hello ${firstName},`)}
        ${createParagraph(`You have been removed from the company <strong>${removedCompanyName}</strong>.`)}
        ${createParagraph('You no longer have access to this company\'s resources.')}
      `;
      break;
    case "role_updated":
      const { newRole, companyName: roleCompName, isDemotion } = params.metadata || {};
      if (newRole === 'user' || isDemotion) {
        return createRoleDemotionEmail({
          firstName,
          companyName: roleCompName,
          newRole: 'user',
          loginUrl,
          email: emailTo
        });
      } else {
        // Owner or Admin
        // Assumption: Promote
        return createRolePromotionEmail({
          firstName,
          companyName: roleCompName,
          newRole,
          loginUrl,
          email: emailTo
        });
      }
    case "join_request_approved":
      return createJoinRequestApprovedEmail({
        firstName,
        companyName: params.metadata?.companyName || "the company",
        dashboardUrl: `${baseUrl}/dashboard`,
      });
  }

  return createBaseEmail({
    heading: getEmailSubject(type, params),
    body,
    footer: 'airlog-pro.vercel.app',
  });
}
