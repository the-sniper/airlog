import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface UserAnalytics {
  stats: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    retentionRate: number;
    totalVisits: number;
    uniqueVisitors: number;
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
  recentViews: {
    id: string;
    path: string;
    ip_address: string | null;
    domain: string | null;
    user?: { email: string } | null;
    created_at: string;
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

    // Create client directly (bypassing createAdminClient which has issues)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get allowed domain from NEXT_PUBLIC_APP_URL for filtering page views
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let allowedDomain: string;
    try {
      allowedDomain = new URL(appUrl).host; // includes port if present
    } catch {
      allowedDomain = "localhost:3000";
    }

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

    // Retention rate: % of all users who have logged in at least once during the period
    const usersLoggedInDuringPeriod = allUsers.filter((u) => {
      if (!u.last_login_at) return false;
      return new Date(u.last_login_at) >= startDate;
    }).length;
    const retentionRate =
      totalUsers > 0
        ? Math.round((usersLoggedInDuringPeriod / totalUsers) * 100)
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

    // Login activity over time - fetch from user_logins table for accurate counts
    let loginActivity: { date: string; logins: number }[] = [];
    try {
      const { data: loginEvents } = await supabase
        .from("user_logins")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (loginEvents && loginEvents.length > 0) {
        const loginActivityMap = new Map<string, number>();
        loginEvents.forEach((event) => {
          const date = new Date(event.created_at).toISOString().split("T")[0];
          loginActivityMap.set(date, (loginActivityMap.get(date) || 0) + 1);
        });

        loginActivity = Array.from(loginActivityMap.entries())
          .map(([date, logins]) => ({ date, logins }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30); // Last 30 days of login data
      }
    } catch {
      // Fallback to last_login_at if user_logins table doesn't exist yet
      const loginActivityMap = new Map<string, number>();
      allUsers.forEach((user) => {
        if (user.last_login_at) {
          const date = new Date(user.last_login_at).toISOString().split("T")[0];
          if (new Date(date) >= startDate || timeFilter === "all") {
            loginActivityMap.set(date, (loginActivityMap.get(date) || 0) + 1);
          }
        }
      });

      loginActivity = Array.from(loginActivityMap.entries())
        .map(([date, logins]) => ({ date, logins }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);
    }

    // Recent logins (last 20 login events with user details)
    let recentLogins: UserAnalytics["recentLogins"] = [];
    try {
      const { data: recentLoginEvents, error: loginEventsError } = await supabase
        .from("user_logins")
        .select("id, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(20);


      if (recentLoginEvents && recentLoginEvents.length > 0) {
        // Map user_ids to user data from allUsers (which already has company info)
        const userMap = new Map(allUsers.map(u => [u.id, u]));
        

        
        recentLogins = recentLoginEvents
          .map((event: any) => {
            const user = userMap.get(event.user_id);
            if (!user) return null;
            return {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              last_login_at: event.created_at,
              created_at: user.created_at,
              company: Array.isArray(user.companies) ? user.companies[0] : user.companies,
            };
          })
          .filter(Boolean) as UserAnalytics["recentLogins"];

      }
    } catch {
      // Fallback to last_login_at if user_logins table doesn't exist yet
      recentLogins = allUsers
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
          company: Array.isArray(u.companies) ? u.companies[0] : u.companies,
        }));
    }

    // Fetch visitor stats (safely handle if table missing)
    let totalVisits = 0;
    let uniqueVisitors = 0;

    try {
      const { count } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("domain", allowedDomain)
        .gte("created_at", startDate.toISOString());
      
      totalVisits = count || 0;

      // For unique visitors, fetch IDs (limit to prevent memory issues, e.g. 5000)
      const { data: visitors } = await supabase
        .from("page_views")
        .select("visitor_id")
        .eq("domain", allowedDomain)
        .gte("created_at", startDate.toISOString())
        .limit(10000);
        
      if (visitors) {
        const uniqueIds = new Set(visitors.map(v => v.visitor_id).filter(Boolean));
        uniqueVisitors = uniqueIds.size;
      }
    } catch (e) {
      console.warn("Page views table missing or error:", e);
    }

    // Fetch recent views with IPs
    let recentViews: UserAnalytics["recentViews"] = [];
    try {
      const { data: views } = await supabase
        .from("page_views")
        .select(`
          id,
          path,
          ip_address,
          domain,
          created_at,
          user:users!left(email)
        `)
        .eq("domain", allowedDomain)
        .neq("path", "/admin/analytics")
        .order("created_at", { ascending: false })
        .limit(20);

      if (views) {
        recentViews = views.map((v: any) => ({
          id: v.id,
          path: v.path,
          ip_address: v.ip_address,
          domain: v.domain,
          user: Array.isArray(v.user) ? v.user[0] : v.user,
          created_at: v.created_at,
        }));
      }
    } catch (e) {
       // Ignore if table doesn't exist yet
    }

    const analytics: UserAnalytics = {
      stats: {
        totalUsers,
        activeUsers,
        newSignups,
        retentionRate,
        totalVisits,
        uniqueVisitors,
      },
      userGrowth: filteredUserGrowth,
      loginActivity,
      recentLogins,
      recentViews,
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
