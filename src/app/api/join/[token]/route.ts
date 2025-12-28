import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
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
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    }
  );
  const testers = await testerRes.json();
  const tester = testers?.[0];
  if (!tester) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });


  // Fetch session without scenes first
  const sessionRes = await fetch(
    `${supabaseUrl}/rest/v1/sessions?id=eq.${tester.session_id}&select=*`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    }
  );

  const sessions = await sessionRes.json();
  const session = sessions?.[0];

  // Fetch scenes with proper ordering
  if (session) {
    const scenesRes = await fetch(
      `${supabaseUrl}/rest/v1/scenes?session_id=eq.${session.id}&select=*,poll_questions(*)&order=order_index.asc`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      }
    );
    const scenes = await scenesRes.json();
    session.scenes = scenes || [];
  }

  // Fetch poll responses for this tester
  const pollResponsesRes = await fetch(
    `${supabaseUrl}/rest/v1/poll_responses?tester_id=eq.${tester.id}&select=*`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    }
  );

  const pollResponses = await pollResponsesRes.json();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "completed") return NextResponse.json({ error: "Session has ended" }, { status: 410 });
  if (session.status === "draft") return NextResponse.json({ error: "Session not started" }, { status: 425 });

  // If the tester had previously left (left_at is set), clear it since they're rejoining
  // Also set joined_at if not already set
  const updateFields: Record<string, unknown> = {};

  if (tester.left_at) {
    updateFields.left_at = null;
  }

  if (!tester.joined_at) {
    updateFields.joined_at = new Date().toISOString();
  }

  if (Object.keys(updateFields).length > 0) {
    const { data: updatedTester } = await supabase
      .from("testers")
      .update(updateFields)
      .eq("id", tester.id)
      .select()
      .single();

    return NextResponse.json({
      tester: updatedTester || tester,
      session,
      pollResponses: pollResponses || []
    });
  }

  return NextResponse.json({ tester, session, pollResponses: pollResponses || [] });
}
