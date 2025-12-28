import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = user.email.toLowerCase();

    // Query for testers by user_id
    const { data: byUserId, error: error1 } = await supabase
      .from("testers")
      .select(
        `
          id,
          session_id,
          invite_token,
          invite_sent_at,
          report_sent_at,
          created_at,
          user_id,
          email,
          first_name,
          last_name,
          session:sessions(
            id,
            name,
            status,
            started_at,
            ended_at,
            last_restarted_at,
            restart_count,
            first_ended_at,
            share_token
          )
        `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Query for testers by email (case-insensitive)
    const { data: byEmail, error: error2 } = await supabase
      .from("testers")
      .select(
        `
          id,
          session_id,
          invite_token,
          invite_sent_at,
          report_sent_at,
          created_at,
          user_id,
          email,
          first_name,
          last_name,
          session:sessions(
            id,
            name,
            status,
            started_at,
            ended_at,
            last_restarted_at,
            restart_count,
            first_ended_at,
            share_token
          )
        `,
      )
      .ilike("email", normalizedEmail)
      .order("created_at", { ascending: false });

    if (error1 || error2) {
      console.error("[API /users/testers] Query error:", error1 || error2);
      return NextResponse.json(
        { error: "Failed to load testers" },
        { status: 500 },
      );
    }

    // Merge and dedupe results
    const allTesters = [...(byUserId || []), ...(byEmail || [])];
    const seen = new Set<string>();
    const testers = allTesters.filter((t: any) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    // Sort by created_at descending
    testers.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Backfill missing user_id where email matches and clear left_at for rejoining
    const missingLinks = testers
      .filter(
        (t: any) =>
          !t.user_id &&
          typeof t.email === "string" &&
          t.email.toLowerCase() === normalizedEmail,
      )
      .map((t: any) => t.id);
    if (missingLinks.length > 0) {
      await supabase
        .from("testers")
        .update({ user_id: user.id, left_at: null })
        .in("id", missingLinks);
    }

    // Also clear left_at for any testers that already have user_id set (rejoining after leaving)
    const rejoinIds = testers
      .filter((t: any) => t.user_id === user.id && t.left_at)
      .map((t: any) => t.id);
    if (rejoinIds.length > 0) {
      await supabase
        .from("testers")
        .update({ left_at: null })
        .in("id", rejoinIds);
    }

    return NextResponse.json({ testers });
  } catch (err) {
    console.error("[API /users/testers] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
