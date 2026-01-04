import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import {
  getDateRange,
  STATUS_COLORS,
} from "@/lib/admin-analytics";
import type { DashboardStats } from "@/lib/admin-analytics";
import type { NoteCategory } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await getCurrentCompanyAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const timeFilter =
    (searchParams.get("timeFilter") as "7d" | "30d" | "all") || "30d";

  const startDate = getDateRange(timeFilter);
  const companyId = admin.company_id;

  try {
    // Fetch sessions for this company
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        "id, name, status, build_version, created_at, started_at, ended_at, company_id",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (sessionsError) throw sessionsError;

    // Fetch testers for sessions of this company
    // We filter by sessions belonging to this company using !inner join
    const { data: testers, error: testersError } = await supabase
      .from("testers")
      .select("id, session_id, first_name, last_name, created_at, sessions!inner(company_id)")
      .eq("sessions.company_id", companyId);

    if (testersError) throw testersError;

    // Fetch notes for sessions of this company
    // We filter by sessions belonging to this company using !inner join
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select(
        `
        id,
        session_id,
        scene_id,
        tester_id,
        category,
        edited_transcript,
        raw_transcript,
        created_at,
        scenes!inner(id, name, session_id),
        testers!inner(id, first_name, last_name),
        sessions!inner(company_id)
      `,
      )
      .eq("sessions.company_id", companyId)
      .order("created_at", { ascending: false });

    if (notesError) throw notesError;

    // Fetch scenes info - filtering by sessions in this company
    const { data: scenes, error: scenesError } = await supabase.from("scenes")
      .select(`
        id,
        name,
        session_id,
        sessions!inner(id, name, company_id)
      `)
      .eq("sessions.company_id", companyId);

    if (scenesError) throw scenesError;

    // Filter data by date range if applicable
    const filteredSessions = startDate
      ? sessions?.filter((s) => new Date(s.created_at) >= startDate) || []
      : sessions || [];

    const filteredNotes = startDate
      ? notes?.filter((n) => new Date(n.created_at) >= startDate) || []
      : notes || [];

    const filteredTesters = startDate
      ? testers?.filter((t) => new Date(t.created_at) >= startDate) || []
      : testers || [];

    // Calculate summary stats
    const totalSessions = filteredSessions.length;
    const activeSessions = filteredSessions.filter(
      (s) => s.status === "active",
    ).length;
    const completedSessions = filteredSessions.filter(
      (s) => s.status === "completed",
    ).length;
    const draftSessions = filteredSessions.filter(
      (s) => s.status === "draft",
    ).length;
    const totalTesters = filteredTesters.length;
    const totalNotes = filteredNotes.length;

    // Notes by category
    const notesByCategory: Record<NoteCategory, number> = {
      bug: 0,
      feature: 0,
      ux: 0,
      performance: 0,
      other: 0,
    };

    filteredNotes.forEach((note) => {
      const category = note.category as NoteCategory;
      if (notesByCategory[category] !== undefined) {
        notesByCategory[category]++;
      }
    });

    // Sessions by status (for pie chart)
    const sessionsByStatus = [
      { status: "Draft", count: draftSessions, color: STATUS_COLORS.draft },
      { status: "Active", count: activeSessions, color: STATUS_COLORS.active },
      {
        status: "Completed",
        count: completedSessions,
        color: STATUS_COLORS.completed,
      },
    ].filter((s) => s.count > 0);

    // Time-series data
    const sessionsOverTime: {
      date: string;
      sessions: number;
      notes: number;
      bugs: number;
    }[] = [];
    const dateMap = new Map<
      string,
      { sessions: number; notes: number; bugs: number }
    >();

    filteredSessions.forEach((session) => {
      const dateKey = new Date(session.created_at).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { sessions: 0, notes: 0, bugs: 0 });
      }
      dateMap.get(dateKey)!.sessions++;
    });

    filteredNotes.forEach((note) => {
      const dateKey = new Date(note.created_at).toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { sessions: 0, notes: 0, bugs: 0 });
      }
      dateMap.get(dateKey)!.notes++;
      if (note.category === "bug") {
        dateMap.get(dateKey)!.bugs++;
      }
    });

    // Sort by date and convert to array
    const sortedDates = Array.from(dateMap.keys()).sort();
    sortedDates.forEach((date) => {
      sessionsOverTime.push({
        date,
        ...dateMap.get(date)!,
      });
    });

    // Top scenes by feedback (aggregate across all sessions)
    const sceneStats = new Map<
      string,
      {
        sceneName: string;
        sessionName: string;
        noteCount: number;
        bugCount: number;
      }
    >();

    filteredNotes.forEach((note) => {
      const sceneId = note.scene_id;
      const sceneInfo = scenes?.find((s) => s.id === sceneId);
      const noteScene = note.scenes as unknown as {
        id: string;
        name: string;
        session_id: string;
      };
      
      // Handle the nested structure from the join
      const sceneSession = sceneInfo?.sessions as unknown as {
        id: string;
        name: string;
      };

      if (!sceneStats.has(sceneId)) {
        sceneStats.set(sceneId, {
          sceneName: noteScene?.name || "Unknown Scene",
          sessionName: sceneSession?.name || "Unknown Session",
          noteCount: 0,
          bugCount: 0,
        });
      }

      const stats = sceneStats.get(sceneId)!;
      stats.noteCount++;
      if (note.category === "bug") {
        stats.bugCount++;
      }
    });

    const topScenes = Array.from(sceneStats.entries())
      .map(([sceneId, stats]) => ({
        sceneId,
        ...stats,
      }))
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 5);

    // Recent notes (last 5)
    const recentNotes = filteredNotes.slice(0, 5).map((note) => {
      const noteTester = note.testers as unknown as {
        id: string;
        first_name: string;
        last_name: string;
      };
      const noteScene = note.scenes as unknown as {
        id: string;
        name: string;
        session_id: string;
      };
      const sceneInfo = scenes?.find((s) => s.id === note.scene_id);
      const sceneSession = sceneInfo?.sessions as unknown as {
        id: string;
        name: string;
      };

      return {
        id: note.id,
        transcript: note.edited_transcript || note.raw_transcript || "",
        category: note.category as NoteCategory,
        testerName: `${noteTester.first_name} ${noteTester.last_name}`,
        sceneName: noteScene.name,
        sessionName: sceneSession?.name || "Unknown",
        createdAt: note.created_at,
      };
    });

    // Tester leaderboard - top contributors by note count
    const testerStats = new Map<
      string,
      { testerId: string; name: string; noteCount: number; bugCount: number }
    >();

    filteredNotes.forEach((note) => {
      const noteTester = note.testers as unknown as {
        id: string;
        first_name: string;
        last_name: string;
      };
      const testerId = note.tester_id;

      if (!testerStats.has(testerId)) {
        testerStats.set(testerId, {
          testerId,
          name: `${noteTester.first_name} ${noteTester.last_name}`,
          noteCount: 0,
          bugCount: 0,
        });
      }

      const stats = testerStats.get(testerId)!;
      stats.noteCount++;
      if (note.category === "bug") {
        stats.bugCount++;
      }
    });

    const testerLeaderboard = Array.from(testerStats.values())
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 5);

    // Active sessions list for banner
    const activeSessionsData =
      sessions?.filter((s) => s.status === "active") || [];
    const activeSessionsList = activeSessionsData.map((session) => {
      const sessionTesters =
        testers?.filter((t) => t.session_id === session.id) || [];
      const sessionNotes =
        notes?.filter((n) => n.session_id === session.id) || [];

      return {
        id: session.id,
        name: session.name,
        build_version: session.build_version || undefined,
        started_at: session.started_at || session.created_at,
        testerCount: sessionTesters.length,
        noteCount: sessionNotes.length,
      };
    });

    const dashboardStats: DashboardStats = {
      totalSessions,
      activeSessions,
      completedSessions,
      draftSessions,
      totalTesters,
      totalNotes,
      notesByCategory,
      sessionsByStatus,
      sessionsOverTime,
      topScenes,
      testerLeaderboard,
      recentNotes,
      activeSessionsList,
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
