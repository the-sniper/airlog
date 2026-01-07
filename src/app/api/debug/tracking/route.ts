import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Diagnostic endpoint to check tracking configuration
// Access this at /api/debug/tracking to see why tracking might not be working
export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let allowedDomain: string;
  try {
    allowedDomain = new URL(appUrl).host;
  } catch {
    allowedDomain = "localhost:3000";
  }
  
  const requestDomain = req.headers.get("host");
  const domainMatch = requestDomain === allowedDomain;
  
  // Check if tables exist and have data
  let userLoginsStatus = { exists: false, count: 0, recentCount: 0, error: null as string | null };
  let pageViewsStatus = { exists: false, count: 0, recentCount: 0, error: null as string | null };
  
  try {
    const { count, error } = await supabase
      .from("user_logins")
      .select("*", { count: "exact", head: true });
    
    if (error) {
      userLoginsStatus.error = error.message;
    } else {
      userLoginsStatus.exists = true;
      userLoginsStatus.count = count || 0;
      
      // Check recent (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from("user_logins")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday);
      
      userLoginsStatus.recentCount = recentCount || 0;
    }
  } catch (e: any) {
    userLoginsStatus.error = e.message;
  }
  
  try {
    const { count, error } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true });
    
    if (error) {
      pageViewsStatus.error = error.message;
    } else {
      pageViewsStatus.exists = true;
      pageViewsStatus.count = count || 0;
      
      // Check recent (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday);
      
      pageViewsStatus.recentCount = recentCount || 0;
    }
  } catch (e: any) {
    pageViewsStatus.error = e.message;
  }
  
  // Test insert to user_logins (with a test user that shouldn't exist)
  let insertTestResult = { success: false, error: null as string | null };
  
  // We won't actually insert, but we can test the RLS by attempting a select
  const { error: rlsTestError } = await supabase
    .from("user_logins")
    .select("id")
    .limit(1);
  
  if (rlsTestError) {
    insertTestResult.error = `RLS may be blocking: ${rlsTestError.message}`;
  } else {
    insertTestResult.success = true;
  }
  
  // Fetch actual recent data for debugging
  let recentLoginData: any[] = [];
  let recentPageViewData: any[] = [];
  
  try {
    const { data: logins } = await supabase
      .from("user_logins")
      .select("id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    recentLoginData = logins || [];
  } catch {}
  
  try {
    const { data: views } = await supabase
      .from("page_views")
      .select("id, path, user_id, visitor_id, domain, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    recentPageViewData = views || [];
  } catch {}
  
  // Check if users from logins exist in users table
  let userCheckResults: any[] = [];
  for (const login of recentLoginData) {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, first_name, deleted_at")
      .eq("id", login.user_id)
      .single();
    
    userCheckResults.push({
      login_user_id: login.user_id,
      user_found: !!user,
      user_deleted: user?.deleted_at ? true : false,
      user_email: user?.email || null,
      error: error?.message || null,
    });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    config: {
      NEXT_PUBLIC_APP_URL: appUrl,
      allowedDomain,
      requestDomain,
      domainMatch,
      NODE_ENV: process.env.NODE_ENV,
    },
    tables: {
      user_logins: userLoginsStatus,
      page_views: pageViewsStatus,
    },
    rlsTest: insertTestResult,
    recentData: {
      logins: recentLoginData,
      pageViews: recentPageViewData,
      userCheck: userCheckResults,
    },
    recommendation: !domainMatch 
      ? `Domain mismatch! Request comes from "${requestDomain}" but NEXT_PUBLIC_APP_URL is set to "${appUrl}" (domain: "${allowedDomain}"). Update NEXT_PUBLIC_APP_URL to match your production domain.`
      : userLoginsStatus.error 
        ? `user_logins table issue: ${userLoginsStatus.error}`
        : pageViewsStatus.error
          ? `page_views table issue: ${pageViewsStatus.error}`
          : userLoginsStatus.recentCount === 0 && pageViewsStatus.recentCount === 0
            ? "Tables exist but no data in last 24 hours. Check server logs for tracking errors."
            : "Configuration looks correct!",
  });
}
