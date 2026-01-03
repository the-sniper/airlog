import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/utils";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";

async function checkAccess(id: string) {
  const admin = await getCurrentCompanyAdmin();
  if (!admin) return { error: "Unauthorized", status: 401 };

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!session || session.company_id !== admin.company_id) {
    return { error: "Forbidden", status: 403 };
  }
  return { supabase };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = access.supabase!;
  const { data } = await supabase
    .from("testers")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = access.supabase!;
  const body = await req.json();

  // Helper to find user by email (case-insensitive)
  async function findUserByEmail(
    email: string | null | undefined
  ): Promise<string | null> {
    if (!email) return null;
    const { data } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email.toLowerCase())
      .single();
    return data?.id || null;
  }

  // Handle bulk add from team members
  if (body.members && Array.isArray(body.members)) {
    // Collect all emails to batch lookup users
    const emails = body.members
      .map((m: { email?: string }) => m.email?.toLowerCase())
      .filter(Boolean) as string[];

    // Batch lookup users by email
    const userMap = new Map<string, string>();
    if (emails.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("email", emails);
      users?.forEach((u: { id: string; email: string }) => {
        userMap.set(u.email.toLowerCase(), u.id);
      });
    }

    const testersToInsert = body.members.map(
      (member: { first_name: string; last_name: string; email?: string }) => {
        const normalizedEmail = member.email?.toLowerCase() || null;
        return {
          session_id: id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: normalizedEmail,
          invite_token: generateInviteToken(),
          user_id: normalizedEmail
            ? userMap.get(normalizedEmail) || null
            : null,
        };
      }
    );

    const { data, error } = await supabase
      .from("testers")
      .insert(testersToInsert)
      .select();
    if (error) {
      console.error("[API POST /testers] Bulk insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Handle single individual tester
  const { first_name, last_name, email } = body;
  if (!first_name || !last_name) {
    return NextResponse.json(
      { error: "First name and last name are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email?.trim().toLowerCase() || null;
  const userId = await findUserByEmail(normalizedEmail);

  const { data, error } = await supabase
    .from("testers")
    .insert({
      session_id: id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      invite_token: generateInviteToken(),
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[API POST /testers] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Safe DELETE: Check session access first
  const { id } = await params;
  const access = await checkAccess(id);
  if (access.error)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const testerId = new URL(req.url).searchParams.get("testerId");
  if (!testerId)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const supabase = access.supabase!;
  
  // Ensure the tester belongs to the session (extra safety)
  await supabase
    .from("testers")
    .delete()
    .eq("id", testerId)
    .eq("session_id", id);
    
  return NextResponse.json({ success: true });
}
