import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/user-auth";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// Check if Super Admin is impersonating as User
async function getSuperAdminImpersonation(): Promise<{
  isSuperAdmin: boolean;
  viewingRole: string | null;
  superAdmin: any | null;
}> {
  const cookieStore = await cookies();
  const viewingRole = cookieStore.get("admin_viewing_role")?.value;
  
  // Only consider "user" role for user impersonation
  if (viewingRole !== "user") {
    return { isSuperAdmin: false, viewingRole: null, superAdmin: null };
  }
  
  const superAdmin = await getCurrentAdmin();
  if (!superAdmin) {
    return { isSuperAdmin: false, viewingRole: null, superAdmin: null };
  }
  
  return { isSuperAdmin: true, viewingRole, superAdmin };
}

export async function GET() {
  // First check if Super Admin is impersonating
  const impersonation = await getSuperAdminImpersonation();
  
  if (impersonation.isSuperAdmin && impersonation.viewingRole === "user") {
    // Super Admin is impersonating as User
    const supabase = createAdminClient();
    
    // Get the first company for demo purposes
    const { data: firstCompany } = await supabase
      .from("companies")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .limit(1)
      .single();
    
    // Return a mock user object for the Super Admin
    return NextResponse.json({
      user: {
        id: impersonation.superAdmin.id,
        first_name: "Super",
        last_name: "Admin (as User)",
        email: impersonation.superAdmin.email,
        created_at: new Date().toISOString(),
        deleted_at: null,
        company: firstCompany || null,
        is_super_admin_impersonating: true,
      },
    });
  }
  
  // Normal user flow
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

