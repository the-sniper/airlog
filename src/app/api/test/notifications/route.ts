import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

/**
 * Test endpoint to create sample notifications
 * Only use in development
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Create a critical notification
    await createNotification({
      type: "service_health",
      severity: "critical",
      title: "Test Critical Alert",
      message: "This is a test critical notification to verify the system is working correctly.",
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Create a warning notification
    await createNotification({
      type: "resource_usage",
      severity: "warning",
      title: "Test Warning Alert",
      message: "This is a test warning notification to verify the system is working correctly.",
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Create an info notification
    await createNotification({
      type: "session_activity",
      severity: "info",
      title: "Test Info Alert",
      message: "This is a test info notification to verify the system is working correctly.",
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test notifications created successfully",
    });
  } catch (error) {
    console.error("Error creating test notifications:", error);
    return NextResponse.json(
      { error: "Failed to create test notifications" },
      { status: 500 },
    );
  }
}
