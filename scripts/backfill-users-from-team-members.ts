/**
 * Backfill `users` from `team_members` and link `testers.user_id` by email.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx ts-node scripts/backfill-users-from-team-members.ts
 *
 * Notes:
 * - Generates a temporary password per new user (logged to console). Replace/reset these via your real auth flow.
 * - Requires `bcryptjs` (already in dependencies) and access to the service role key.
 */

import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TeamMember = {
  first_name: string;
  last_name: string;
  email: string | null;
  created_at: string;
};
type UserRow = { id: string; email: string };

function randomPassword() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `Temp-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `Temp-${Math.random().toString(16).slice(2, 10)}`;
}

async function main() {
  // Fetch team members with emails
  const { data: teamMembers, error: tmError } = await supabase
    .from("team_members")
    .select("first_name,last_name,email,created_at")
    .not("email", "is", null);
  if (tmError) throw tmError;

  // Fetch existing users keyed by email for quick lookups
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id,email");
  if (usersError) throw usersError;
  const userByEmail = new Map(
    users.map((u) => [u.email.toLowerCase(), u as UserRow]),
  );

  const created: Array<{ email: string; password: string; userId: string }> =
    [];

  for (const tm of teamMembers as TeamMember[]) {
    if (!tm.email) continue;
    const email = tm.email.toLowerCase();
    if (userByEmail.has(email)) continue;

    const password = randomPassword();
    const password_hash = await bcrypt.hash(password, 10);
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: tm.first_name,
        last_name: tm.last_name,
        email: tm.email,
        password_hash,
        created_at: tm.created_at,
      })
      .select("id,email")
      .maybeSingle();

    if (insertError || !inserted)
      throw insertError || new Error("Insert failed");
    userByEmail.set(email, inserted as UserRow);
    created.push({ email: inserted.email, password, userId: inserted.id });
  }

  // Link testers to users by matching email when user_id is null
  for (const [email, user] of Array.from(userByEmail.entries())) {
    const { error: updateError } = await supabase
      .from("testers")
      .update({ user_id: user.id })
      .eq("email", email)
      .is("user_id", null);
    if (updateError) throw updateError;
  }

  // eslint-disable-next-line no-console
  console.log("Backfill complete.");
  if (created.length) {
    // eslint-disable-next-line no-console
    console.table(created, ["email", "userId", "password"]);
  } else {
    // eslint-disable-next-line no-console
    console.log("No new users created (all team members already registered).");
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Backfill failed:", err);
  process.exit(1);
});
