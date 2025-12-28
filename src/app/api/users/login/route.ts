import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  clearUserAuthCookie,
  createUserToken,
  setUserAuthCookie,
  verifyPassword,
} from "@/lib/user-auth";

export async function POST(req: Request) {
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

    const token = await createUserToken(user.id);
    await setUserAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
