import { NextRequest, NextResponse } from "next/server";
import { checkNotificationTriggers } from "@/lib/notification-checker";

/**
 * Cron endpoint to check notifications periodically
 * Called by Vercel Cron every 30 minutes
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    // In production, Vercel sends CRON_SECRET automatically
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow in development, but require auth in production
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isProduction && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log("[Cron] Unauthorized request rejected");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] Starting notification check...");
    await checkNotificationTriggers();
    console.log("[Cron] Notification check completed");

    return NextResponse.json({
      success: true,
      message: "Notification check completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error in notification check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Vercel Cron requires this config for edge runtime compatibility
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for the check
