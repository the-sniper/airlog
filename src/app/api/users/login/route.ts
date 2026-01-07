import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  clearUserAuthCookie,
  createUserToken,
  setUserAuthCookie,
  verifyPassword,
} from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("email", normalizedEmail)
      .single();

    if (!user) {
      await clearUserAuthCookie();
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await clearUserAuthCookie();
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Update last login timestamp for analytics (quick lookup of most recent login)
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    // Record login event for detailed analytics tracking
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    
    const { error: loginTrackError } = await supabase.from("user_logins").insert({
      user_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    if (loginTrackError) {
      console.error("[LOGIN TRACKING ERROR]", {
        error: loginTrackError.message,
        code: loginTrackError.code,
        userId: user.id,
      });
    }

    const token = await createUserToken(user.id);
    await setUserAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
