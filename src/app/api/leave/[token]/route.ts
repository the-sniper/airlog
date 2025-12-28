import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/leave/[token]
 * Marks a tester as having left the session by setting their left_at timestamp
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  const supabase = createAdminClient();

  // Find the tester by invite token
  const { data: tester, error: testerError } = await supabase
    .from("testers")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (testerError || !tester) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  // Note: We no longer require user_id to leave - any tester with a valid token can leave

  // Update the tester's left_at timestamp
  const { data: updatedTester, error: updateError } = await supabase
    .from("testers")
    .update({ left_at: new Date().toISOString() })
    .eq("id", tester.id)
    .select()
    .single();

  if (updateError) {
    console.error("[LEAVE API] Error updating tester left_at:", updateError);
    return NextResponse.json(
      { error: "Failed to leave session" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    tester: updatedTester,
  });
}
