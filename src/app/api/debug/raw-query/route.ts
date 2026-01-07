import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Ultra-minimal debug endpoint to test database connectivity
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Check if env vars exist
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({
      error: "Missing environment variables",
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
    });
  }
  
  // Create a fresh Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  // Test 1: Simple count of user_logins
  const { count: loginCount, error: countError } = await supabase
    .from("user_logins")
    .select("*", { count: "exact", head: true });
  
  // Test 2: Select from user_logins
  const { data: logins, error: selectError } = await supabase
    .from("user_logins")
    .select("id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  
  // Test 3: Select from users for comparison
  const { count: userCount, error: userError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: supabaseUrl.substring(0, 30) + "...",
      serviceRoleKeyLength: serviceRoleKey.length,
      serviceRoleKeyPrefix: serviceRoleKey.substring(0, 10) + "...",
    },
    tests: {
      loginCount: {
        count: loginCount,
        error: countError?.message || null,
        errorCode: countError?.code || null,
      },
      loginSelect: {
        count: logins?.length || 0,
        error: selectError?.message || null,
        errorCode: selectError?.code || null,
        data: logins,
      },
      userCount: {
        count: userCount,
        error: userError?.message || null,
      },
    },
  });
}
