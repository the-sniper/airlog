import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Verify super admin
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch sessions for this company
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      companies!inner (
        id,
        name,
        slug
      ),
      scenes (count),
      testers (count),
      notes (count)
    `
    )
    .eq("company_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }

  return NextResponse.json(sessions);
}
