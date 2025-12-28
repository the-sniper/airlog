import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { HistoricalSession } from "@/lib/analytics";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const supabase = createAdminClient();

  try {
    // First, get the current session to get its ended_at date
    const { data: currentSession, error: currentError } = await supabase
      .from("sessions")
      .select("id, ended_at")
      .eq("id", id)
      .single();

    if (currentError || !currentSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get all sessions (excluding current), limited to last 10
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
        id,
        name,
        build_version,
        started_at,
        ended_at,
        status,
        notes (id, category),
        testers (id)
      `,
      )
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error("Error fetching historical sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch historical data" },
        { status: 500 },
      );
    }

    // Transform to HistoricalSession format
    const historicalSessions: HistoricalSession[] = (sessions || []).map(
      (s) => ({
        id: s.id,
        name: s.name,
        build_version: s.build_version,
        started_at: s.started_at,
        ended_at: s.ended_at,
        totalNotes: s.notes?.length || 0,
        bugCount:
          s.notes?.filter((n: { category: string }) => n.category === "bug")
            .length || 0,
        testerCount: s.testers?.length || 0,
      }),
    );

    // Sort by started_at ascending (oldest first) for trend display, fall back to ended_at
    historicalSessions.sort((a, b) => {
      const dateA = new Date(a.started_at || a.ended_at || 0).getTime();
      const dateB = new Date(b.started_at || b.ended_at || 0).getTime();
      return dateA - dateB;
    });

    return NextResponse.json({ sessions: historicalSessions });
  } catch (error) {
    console.error("Error in historical endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
