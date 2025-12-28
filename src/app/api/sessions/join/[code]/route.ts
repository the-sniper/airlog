import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

// GET - Validate session join code and return session info
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { code } = params;
  const supabase = createAdminClient();

  // Find session by join code
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, name, status, description")
    .eq("join_code", code.toUpperCase())
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: "Invalid session code" },
      { status: 404 },
    );
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "Session has ended" }, { status: 410 });
  }

  return NextResponse.json({
    sessionName: session.name,
    sessionId: session.id,
    status: session.status,
    description: session.description,
  });
}

// POST - Join session as logged-in user (creates/finds tester)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const { code } = params;

  // Require authentication
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // Find session by join code
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*, scenes(*, poll_questions(*))")
    .eq("join_code", code.toUpperCase())
    .order("order_index", { referencedTable: "scenes", ascending: true })
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Invalid session code" },
      { status: 404 },
    );
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "Session has ended" }, { status: 410 });
  }

  if (session.status === "draft") {
    return NextResponse.json(
      { error: "Session not started yet" },
      { status: 425 },
    );
  }

  const normalizedEmail = user.email.toLowerCase();

  // Check if user already has a tester entry for this session
  let { data: tester } = await supabase
    .from("testers")
    .select("*")
    .eq("session_id", session.id)
    .eq("email", normalizedEmail)
    .single();

  if (!tester) {
    // Create new tester entry for this user - they are joining now
    const { data: newTester, error: createError } = await supabase
      .from("testers")
      .insert({
        session_id: session.id,
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: normalizedEmail,
        invite_token: crypto.randomUUID(), // Still need a token for internal tracking
        reported_issues: [],
        joined_at: new Date().toISOString(), // They are joining now
      })
      .select()
      .single();

    if (createError || !newTester) {
      console.error("Failed to create tester:", createError);
      return NextResponse.json(
        { error: "Failed to join session" },
        { status: 500 },
      );
    }

    tester = newTester;
  } else {
    // Update existing tester
    const updateFields: Record<string, unknown> = {};

    // Set user_id if not set
    if (!tester.user_id) {
      updateFields.user_id = user.id;
    }

    // Set joined_at if not set (first time actually joining)
    if (!tester.joined_at) {
      updateFields.joined_at = new Date().toISOString();
    }

    // Clear left_at if rejoining explicitly
    const shouldRejoin = req.nextUrl.searchParams.get("rejoin") === "true";
    if (tester.left_at && shouldRejoin) {
      updateFields.left_at = null;
    }

    if (Object.keys(updateFields).length > 0) {
      const { data: updatedTester } = await supabase
        .from("testers")
        .update(updateFields)
        .eq("id", tester.id)
        .select()
        .single();

      tester = updatedTester || tester;
    }
  }

  // Fetch poll responses for this tester
  const { data: pollResponses } = await supabase
    .from("poll_responses")
    .select("*")
    .eq("tester_id", tester.id);

  return NextResponse.json({
    tester,
    session,
    pollResponses: pollResponses || [],
  });
}
