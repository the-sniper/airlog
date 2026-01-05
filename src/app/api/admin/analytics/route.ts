import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface UserAnalytics {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    retentionRate: number;
  };
  userGrowth: { date: string; count: number; cumulative: number }[];
  loginActivity: { date: string; logins: number }[];
  recentLogins: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    last_login_at: string | null;
    created_at: string;
    company?: { id: string; name: string } | null;
  }[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get("timeFilter") || "30d";

    // Calculate date range based on filter
    const now = new Date();
    let startDate: Date;
    switch (timeFilter) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = new Date(0); // Beginning of time
    }

    const supabase = createAdminClient();

    // Fetch all users with company info
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        created_at,
        last_login_at,
        deleted_at,
        companies(id, name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const allUsers = users || [];

    // Calculate stats
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => {
      if (!u.last_login_at) return false;
      return new Date(u.last_login_at) >= startDate;
    }).length;
    const newSignups = allUsers.filter(
      (u) => new Date(u.created_at) >= startDate
    ).length;

    // Retention rate: users who signed up before the period and logged in during the period
    const existingUsers = allUsers.filter(
      (u) => new Date(u.created_at) < startDate
    );
    const returningUsers = existingUsers.filter((u) => {
      if (!u.last_login_at) return false;
      return new Date(u.last_login_at) >= startDate;
    }).length;
    const retentionRate =
      existingUsers.length > 0
        ? Math.round((returningUsers / existingUsers.length) * 100)
        : 0;

    // User growth over time (cumulative)
    const userGrowthMap = new Map<string, number>();
    allUsers.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0];
      userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
    });

    // Sort dates and calculate cumulative count
    const sortedDates = Array.from(userGrowthMap.keys()).sort();
    let cumulative = 0;
    const userGrowth = sortedDates.map((date) => {
      const count = userGrowthMap.get(date) || 0;
      cumulative += count;
      return { date, count, cumulative };
    });

    // Filter to recent data based on time filter
    const filteredUserGrowth =
      timeFilter === "all"
        ? userGrowth.slice(-90) // Last 90 data points for "all"
        : userGrowth.filter((d) => new Date(d.date) >= startDate);

    // Login activity over time
    const loginActivityMap = new Map<string, number>();
    allUsers.forEach((user) => {
      if (user.last_login_at) {
        const date = new Date(user.last_login_at).toISOString().split("T")[0];
        if (new Date(date) >= startDate || timeFilter === "all") {
          loginActivityMap.set(date, (loginActivityMap.get(date) || 0) + 1);
        }
      }
    });

    const loginActivity = Array.from(loginActivityMap.entries())
      .map(([date, logins]) => ({ date, logins }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days of login data

    // Recent logins (last 20 users who logged in)
    const recentLogins = allUsers
      .filter((u) => u.last_login_at)
      .sort(
        (a, b) =>
          new Date(b.last_login_at!).getTime() -
          new Date(a.last_login_at!).getTime()
      )
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
        company: Array.isArray(u.company) ? u.company[0] : u.company,
      }));

    const analytics: UserAnalytics = {
      stats: {
        totalUsers,
        activeUsers,
        newSignups,
        retentionRate,
      },
      userGrowth: filteredUserGrowth,
      loginActivity,
      recentLogins,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
