import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("company:companies(id, name, logo_url)")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      created_at: user.created_at,
      deleted_at: user.deleted_at,
      company: userData?.company || null,
    },
  });
}
