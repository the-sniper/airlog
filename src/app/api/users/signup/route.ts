import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  hashPassword,
  createUserToken,
  setUserAuthCookie,
} from "@/lib/user-auth";
import { generateInviteToken } from "@/lib/utils";

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
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: insertError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    // Link existing testers with same email to this user
    await supabase
      .from("testers")
      .update({ user_id: created.id })
      .eq("email", normalizedEmail)
      .is("user_id", null);

    // Also link team members with same email to this user
    await supabase
      .from("team_members")
      .update({ user_id: created.id })
      .eq("email", normalizedEmail)
      .is("user_id", null);

    // Claim pending invites for this email
    const { data: pendingInvites } = await supabase
      .from("pending_invites")
      .select("*")
      .eq("email", normalizedEmail)
      .is("claimed_at", null)
      .gt("expires_at", new Date().toISOString());

    if (pendingInvites && pendingInvites.length > 0) {
      for (const invite of pendingInvites) {
        try {
          if (invite.invite_type === "session") {
            // Create tester record for the session
            await supabase.from("testers").insert({
              session_id: invite.target_id,
              user_id: created.id,
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              email: normalizedEmail,
              invite_token: generateInviteToken(),
            });
          } else if (invite.invite_type === "team") {
            // Create team member record
            await supabase.from("team_members").insert({
              team_id: invite.target_id,
              user_id: created.id,
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              email: normalizedEmail,
            });
          }

          // Mark invite as claimed
          await supabase
            .from("pending_invites")
            .update({ claimed_at: new Date().toISOString() })
            .eq("id", invite.id);
        } catch (inviteError) {
          console.error("[Signup] Error claiming invite:", inviteError);
          // Continue with other invites even if one fails
        }
      }
    }

    // Auto-login: create token and set auth cookie
    const token = await createUserToken(created.id);
    await setUserAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
