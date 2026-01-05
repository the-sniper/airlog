import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentCompanyAdmin } from "@/lib/company-auth";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// Check if Super Admin is impersonating
async function getSuperAdminImpersonation(): Promise<{
  isSuperAdmin: boolean;
  viewingRole: string | null;
  superAdmin: any | null;
}> {
  const cookieStore = await cookies();
  const viewingRole = cookieStore.get("admin_viewing_role")?.value;
  
  // Only consider owner/manager roles for company impersonation
  if (viewingRole !== "owner" && viewingRole !== "manager") {
    return { isSuperAdmin: false, viewingRole: null, superAdmin: null };
  }
  
  const superAdmin = await getCurrentAdmin();
  if (!superAdmin) {
    return { isSuperAdmin: false, viewingRole: null, superAdmin: null };
  }
  
  return { isSuperAdmin: true, viewingRole, superAdmin };
}

export async function GET() {
  try {
    // First check if Super Admin is impersonating
    const impersonation = await getSuperAdminImpersonation();
    
    if (impersonation.isSuperAdmin && impersonation.viewingRole) {
      // Super Admin is impersonating - fetch the first company for demo purposes
      // In a real implementation, you might want to let them select which company
      const supabase = createAdminClient();
      const { data: firstCompany } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();
      
      if (!firstCompany) {
        return NextResponse.json(
          { error: "No company available for impersonation" },
          { status: 404 }
        );
      }
      
      // Return a mock admin object for the Super Admin
      return NextResponse.json({
        admin: {
          id: `super_admin_${impersonation.superAdmin.id}`,
          role: impersonation.viewingRole, // "owner" or "manager"
          user: {
            id: impersonation.superAdmin.id,
            first_name: "Super",
            last_name: "Admin",
            email: impersonation.superAdmin.email,
            deleted_at: null,
          },
          is_super_admin_impersonating: true,
        },
        company: {
          id: firstCompany.id,
          name: firstCompany.name,
          logo_url: firstCompany.logo_url,
        },
      });
    }
    
    // Normal company admin flow
    const admin = await getCurrentCompanyAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        role: admin.role,
        user: {
          ...admin.user,
          // @ts-ignore - TS might not know about deleted_at yet if interface not updated
          deleted_at: (admin.user as any).deleted_at
        },
      },
      company: admin.company,
    });
  } catch (error) {
    console.error("Get company admin error:", error);
    return NextResponse.json(
      { error: "Failed to get admin info" },
      { status: 500 }
    );
  }
}

