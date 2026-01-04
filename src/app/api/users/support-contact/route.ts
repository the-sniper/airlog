import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let ownerEmail = null;

  // If user belongs to a company, try to find the company owner
  const { data: userData } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

  let companyId = userData?.company_id;

  // Fallback: Check if user is in any team
  if (!companyId) {
      const { data: teamMember } = await supabase
          .from("team_members")
          .select("team:teams(company_id)")
          .eq("user_id", user.id)
          .limit(1)
          .single();
      
      if (teamMember?.team) {
          // @ts-ignore
          companyId = teamMember.team.company_id;
      }
  }

  if (companyId) {
    // 1. Find the user_id of the owner
    const { data: ownerAdmin } = await supabase
      .from("company_admins")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("role", "owner")
      .single();

    if (ownerAdmin?.user_id) {
      // 2. Fetch the email of that user
      const { data: ownerUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", ownerAdmin.user_id)
        .single();
        
      if (ownerUser?.email) {
        ownerEmail = ownerUser.email;
      }
    }
  }

  return NextResponse.json({
    companyOwnerEmail: ownerEmail,
    superAdminEmail: "areefsyed96@gmail.com"
  });
}
