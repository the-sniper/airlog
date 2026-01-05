import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";
import { getCurrentAdmin } from "@/lib/auth";

interface DashboardStats {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  notes: {
    total: number;
    byCategory: {
      bug: number;
      feature: number;
      ux: number;
      performance: number;
      other: number;
    };
  };
  recentActivity: {
    date: string;
    count: number;
  }[];
  recentSessions: {
    id: string;
    name: string;
    status: string;
    joinCode: string;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    shareToken: string | null;
    notesCount: number;
  }[];
}

// Check if Super Admin is impersonating as User
async function getSuperAdminImpersonation(): Promise<{
  isSuperAdmin: boolean;
  superAdmin: any | null;
}> {
  const cookieStore = await cookies();
  const viewingRole = cookieStore.get("admin_viewing_role")?.value;
  
  if (viewingRole !== "user") {
    return { isSuperAdmin: false, superAdmin: null };
  }
  
  const superAdmin = await getCurrentAdmin();
  if (!superAdmin) {
    return { isSuperAdmin: false, superAdmin: null };
  }
  
  return { isSuperAdmin: true, superAdmin };
}

export async function GET() {
  try {
    // Check for Super Admin impersonation first
    const impersonation = await getSuperAdminImpersonation();
    
    if (impersonation.isSuperAdmin) {
      // Return mock dashboard data for Super Admin impersonating as User
      const response: DashboardStats = {
        user: {
          id: impersonation.superAdmin.id,
          firstName: "Super",
          lastName: "Admin (as User)",
          email: impersonation.superAdmin.email,
        },
        sessions: {
          total: 0,
          active: 0,
          completed: 0,
          pending: 0,
        },
        notes: {
          total: 0,
          byCategory: {
            bug: 0,
            feature: 0,
            ux: 0,
            performance: 0,
            other: 0,
          },
        },
        recentActivity: [],
        recentSessions: [],
      };
      return NextResponse.json(response);
    }
    
    // Normal user flow
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = user.email.toLowerCase();

    // Get tester records for this user
    const { data: byUserId } = await supabase
      .from("testers")
      .select(
        `
        id,
        session_id,
        created_at,
        session:sessions(
          id,
          name,
          status,
          join_code,
          started_at,
          ended_at,
          share_token
        )
      `,
      )
      .eq("user_id", user.id);

    const { data: byEmail } = await supabase
      .from("testers")
      .select(
        `
        id,
        session_id,
        created_at,
        session:sessions(
          id,
          name,
          status,
          join_code,
          started_at,
          ended_at,
          share_token
        )
      `,
      )
      .ilike("email", normalizedEmail);

    // Merge and dedupe
    const allTesters = [...(byUserId || []), ...(byEmail || [])];
    const seen = new Set<string>();
    const testers = allTesters.filter((t: any) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    const testerIds = testers.map((t: any) => t.id);

    // Get all notes for these testers
    const { data: notes } = await supabase
      .from("notes")
      .select("id, category, created_at, session_id, tester_id")
      .in("tester_id", testerIds.length > 0 ? testerIds : ["__no_match__"]);

    // Calculate session stats
    const sessionStats = {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
    };

    const recentSessions: DashboardStats["recentSessions"] = [];

    testers.forEach((t: any) => {
      const session = t.session;
      if (!session) return;

      sessionStats.total++;
      if (session.status === "active") sessionStats.active++;
      else if (session.status === "completed") sessionStats.completed++;
      else if (session.status === "draft") sessionStats.pending++;

      // Count notes for this session by this tester
      const sessionNotes = (notes || []).filter(
        (n: any) => n.session_id === session.id && n.tester_id === t.id,
      );

      recentSessions.push({
        id: session.id,
        name: session.name,
        status: session.status,
        joinCode: session.join_code,
        createdAt: t.created_at,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        shareToken: session.share_token,
        notesCount: sessionNotes.length,
      });
    });

    // Sort recent sessions by created_at desc
    recentSessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Calculate note stats
    const noteStats = {
      total: notes?.length || 0,
      byCategory: {
        bug: 0,
        feature: 0,
        ux: 0,
        performance: 0,
        other: 0,
      },
    };

    (notes || []).forEach((n: any) => {
      const cat = n.category as keyof typeof noteStats.byCategory;
      if (noteStats.byCategory[cat] !== undefined) {
        noteStats.byCategory[cat]++;
      }
    });

    // Calculate recent activity (last 7 days)
    const today = new Date();
    const recentActivity: DashboardStats["recentActivity"] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = (notes || []).filter((n: any) => {
        const noteDate = new Date(n.created_at).toISOString().split("T")[0];
        return noteDate === dateStr;
      }).length;

      recentActivity.push({
        date: dateStr,
        count,
      });
    }

    const response: DashboardStats = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      sessions: sessionStats,
      notes: noteStats,
      recentActivity,
      recentSessions, // Return all sessions
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[API /users/dashboard] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
