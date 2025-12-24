import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { first_name, last_name, email, password } = await req.json();

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const password_hash = await hashPassword(password);
    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password_hash,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      return NextResponse.json({ error: insertError?.message || "Failed to create user" }, { status: 500 });
    }

    // Link existing testers with same email to this user
    await supabase
      .from("testers")
      .update({ user_id: created.id })
      .eq("email", normalizedEmail)
      .is("user_id", null);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
