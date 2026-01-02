import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkNotificationTriggers } from "@/lib/notification-checker";

/**
 * GET /api/admin/notifications
 * Fetch all notifications with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const severity = searchParams.get("severity");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createAdminClient();
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false).eq("resolved", false);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Get counts by severity
    const { data: counts } = await supabase
      .from("notifications")
      .select("severity")
      .eq("read", false)
      .eq("resolved", false);

    const severityCounts = {
      critical: counts?.filter((n) => n.severity === "critical").length || 0,
      warning: counts?.filter((n) => n.severity === "warning").length || 0,
      info: counts?.filter((n) => n.severity === "info").length || 0,
    };

    return NextResponse.json({
      notifications: notifications || [],
      counts: severityCounts,
      total: (counts || []).length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/notifications
 * Trigger notification check manually
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "check") {
      // Trigger notification checks
      await checkNotificationTriggers();
      return NextResponse.json({ success: true, message: "Notification check completed" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in POST /api/admin/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
