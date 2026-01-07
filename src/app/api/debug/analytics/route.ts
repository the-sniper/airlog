import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Debug endpoint to see exactly what the analytics API would return
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  
  // Fetch users like the analytics API does
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
  
  // Fetch login events - using EXACT same query as debug/tracking which works
  let recentLoginEvents: any[] = [];
  let loginError: any = null;
  try {
    const { data, error } = await supabase
      .from("user_logins")
      .select("id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    recentLoginEvents = data || [];
    loginError = error;
  } catch (e: any) {
    loginError = { message: e.message };
  }
  
  // Also try a simple count query to verify table access
  const { count: loginCount, error: countError } = await supabase
    .from("user_logins")
    .select("*", { count: "exact", head: true });
  
  // Check if the user_ids from logins match users
  const allUsers = users || [];
  const userMap = new Map(allUsers.map(u => [u.id, u]));
  
  const loginAnalysis = (recentLoginEvents || []).map((event: any) => {
    const user = userMap.get(event.user_id);
    return {
      login_id: event.id,
      login_user_id: event.user_id,
      login_created_at: event.created_at,
      user_found_in_map: !!user,
      user_email: user?.email || null,
    };
  });
  
  // Build recentLogins the same way analytics API does
  const recentLogins = (recentLoginEvents || [])
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
    .filter(Boolean);
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    usersQuery: {
      count: allUsers.length,
      error: usersError?.message || null,
      sampleIds: allUsers.slice(0, 5).map(u => ({ id: u.id, email: u.email })),
    },
    loginEventsQuery: {
      count: recentLoginEvents?.length || 0,
      error: loginError?.message || null,
      events: recentLoginEvents?.slice(0, 5) || [],
    },
    loginCountQuery: {
      count: loginCount || 0,
      error: countError?.message || null,
    },
    loginAnalysis,
    finalRecentLogins: {
      count: recentLogins.length,
      data: recentLogins.slice(0, 5),
    },
  });
}
