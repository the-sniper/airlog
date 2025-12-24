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
    const { data, error } = await supabase
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
        `
      )
      .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to load testers" }, { status: 500 });
    }

    const testers = data || [];

    // Backfill missing user_id where email matches
    const missingLinks = testers
      .filter((t: any) => !t.user_id && typeof t.email === "string" && t.email.toLowerCase() === normalizedEmail)
      .map((t: any) => t.id);
    if (missingLinks.length > 0) {
      await supabase.from("testers").update({ user_id: user.id }).in("id", missingLinks);
    }

    return NextResponse.json({ testers });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
