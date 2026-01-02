import { NextRequest, NextResponse } from "next/server";
import {
  markNotificationAsRead,
  resolveNotification,
} from "@/lib/notifications";

/**
 * PATCH /api/admin/notifications/[id]
 * Mark notification as read or resolved
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, resolvedBy } = body;

    if (action === "read") {
      const success = await markNotificationAsRead(id);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to mark notification as read" },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "resolve") {
      const success = await resolveNotification(id, resolvedBy || "admin");
      if (!success) {
        return NextResponse.json(
          { error: "Failed to resolve notification" },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in PATCH /api/admin/notifications/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
