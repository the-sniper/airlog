import { createAdminClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";
import { createAdminNotificationEmail } from "@/lib/email-templates";

export type NotificationSeverity = "critical" | "warning" | "info";
export type NotificationType =
  | "service_health"
  | "resource_usage"
  | "session_activity"
  | "user_management"
  | "data_quality"
  | "performance"
  | "security";

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

interface CreateNotificationParams {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
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
 * Create a new notification and optionally send email
 * Includes deduplication to prevent spam for the same issue
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification | null> {
  try {
    const supabase = createAdminClient();

    // Check for duplicate notification in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("title", params.title)
      .eq("type", params.type)
      .eq("resolved", false)
      .gte("created_at", oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[Notification] Duplicate suppressed: ${params.title}`);
      return null;
    }

    // Insert notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        type: params.type,
        severity: params.severity,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return null;
    }

    // Send email for critical and warning notifications
    if (params.severity === "critical" || params.severity === "warning") {
      await sendNotificationEmail(notification);
    }

    return notification;
  } catch (error) {
    console.error("Error in createNotification:", error);
    return null;
  }
}

/**
 * Send notification email to admin
 */
async function sendNotificationEmail(notification: Notification): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Get admin preferences
    const { data: preferences } = await supabase
      .from("admin_notification_preferences")
      .select("*")
      .single();

    if (!preferences) {
      console.warn("No admin notification preferences found");
      return;
    }

    // Check if email should be sent based on preferences
    const shouldSend =
      (notification.severity === "critical" && preferences.email_critical) ||
      (notification.severity === "warning" && preferences.email_warning) ||
      (notification.severity === "info" && preferences.email_info);

    if (!shouldSend) {
      return;
    }

    const adminEmail = preferences.admin_email;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Severity config for email subject
    const severityConfig = {
      critical: { label: "CRITICAL" },
      warning: { label: "WARNING" },
      info: { label: "INFO" },
    };

    const config = severityConfig[notification.severity];

    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `[${config.label}] ${notification.title} - AirLog`,
      html: createAdminNotificationEmail({
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        dashboardUrl: `${baseUrl}/admin`,
        timestamp: new Date(notification.created_at).toLocaleString("en-US", { 
          dateStyle: "medium", 
          timeStyle: "short" 
        }),
      }),
    });

    // Update notification to mark email as sent
    await supabase
      .from("notifications")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", notification.id);

    console.log(
      `Notification email sent for: ${notification.title} (${notification.severity})`,
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

/**
 * Get all unread notifications
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("read", false)
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching unread notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUnreadNotifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return false;
  }
}

/**
 * Resolve a notification
 */
export async function resolveNotification(
  notificationId: string,
  resolvedBy: string,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notifications")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Error resolving notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in resolveNotification:", error);
    return false;
  }
}
