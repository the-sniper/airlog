import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword, hashToken } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (
      !token ||
      typeof token !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const token_hash = hashToken(token);
    const now = new Date().toISOString();

    const { data: resetRecord } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", token_hash)
      .single();

    if (
      !resetRecord ||
      resetRecord.used_at ||
      new Date(resetRecord.expires_at) < new Date(now)
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    const password_hash = await hashPassword(password);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("id", resetRecord.user_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    await supabase
      .from("password_reset_tokens")
      .update({ used_at: now })
      .eq("id", resetRecord.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
