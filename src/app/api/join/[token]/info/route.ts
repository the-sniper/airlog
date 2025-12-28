import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get basic invite info without full session data (for auth landing page)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  const supabase = createAdminClient();

  // Use direct REST API call to bypass Supabase client caching issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Fetch tester using direct REST API to avoid caching
  const testerRes = await fetch(
    `${supabaseUrl}/rest/v1/testers?invite_token=eq.${token}&select=*`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
    },
  );
  const testers = await testerRes.json();
  const tester = testers?.[0];
  if (!tester)
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });

  // Fetch session name only
  const sessionRes = await fetch(
    `${supabaseUrl}/rest/v1/sessions?id=eq.${tester.session_id}&select=id,name,status`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
    },
  );

  const sessions = await sessionRes.json();
  const session = sessions?.[0];

  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "completed")
    return NextResponse.json({ error: "Session has ended" }, { status: 410 });

  // Return basic info for the landing page
  return NextResponse.json({
    sessionName: session.name,
    testerName: `${tester.first_name} ${tester.last_name}`,
    testerEmail: tester.email,
  });
}
