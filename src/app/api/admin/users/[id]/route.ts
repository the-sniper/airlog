import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const supabase = createAdminClient();

    // 1. Soft delete in public.users (Attempt only)
    try {
        const { error: dbError } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
        
        if (dbError) {
             console.warn("Soft delete in DB failed (likely missing column), proceeding to auth ban:", dbError.message);
        }
    } catch (e) {
        console.warn("Soft delete in DB failed:", e);
    }

    // 2. Ban in auth.users (prevents login)
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: "876600h" // ~100 years
    });

    if (authError) {
      // If user is not found in Auth, they might be a legacy DB-only user backfilled from team_members.
      // They can't login anyway, so we can consider them "disabled" in Auth contexts.
      if (authError.message === 'User not found' || (authError as any).code === 'user_not_found') {
         console.warn("User not found in Auth to ban (skipping):", id);
      } else {
         console.error("Error banning auth user:", authError);
         throw authError;
      }
    }

    // 3. Log action
    await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      action: "DISABLE_USER",
      target_resource: "users",
      target_id: id,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent"),
    });

    // 4. Notify User
    const { notifyUser } = await import("@/lib/user-system-notifications");
    await notifyUser({
        userId: id,
        type: "account_disabled",
        title: "Account Disabled",
        message: "Your account has been disabled by an administrator."
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error disabling user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to disable user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    
    // Check if we are restoring
    if (body.restore) {
        return handleRestore(req, id, admin);
    }

    const { first_name, last_name, email, company_id } = body;
    const supabase = createAdminClient();

    // Fetch current state for logging
    const { data: oldUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    const updates: any = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (company_id !== undefined) updates.company_id = company_id;

    // Handle company removal side-effects
    if (company_id === null && oldUser?.company_id) {
      // 1. Remove from company_admins if they were an admin
      const { error: adminError } = await supabase
        .from("company_admins")
        .delete()
        .eq("user_id", id)
        .eq("company_id", oldUser.company_id);

      if (adminError) {
        console.error("Error removing company admin:", adminError);
      }

      // 2. Fetch company name for notification
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", oldUser.company_id)
        .single();

      if (company) {
        // 3. Notify user
        const { notifyUser } = await import("@/lib/user-system-notifications");
        await notifyUser({
          userId: id,
          type: "company_removed",
          title: `Removed from ${company.name}`,
          message: `You have been removed from the company ${company.name}.`,
          metadata: {
            companyName: company.name,
          },
        });
      }
    }

    // Handle company assignment/change side-effects
    if (company_id && company_id !== oldUser?.company_id) {
      // 1. Fetch company name for notification
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", company_id)
        .single();

      if (company) {
        // 2. Notify user
        const { notifyUser } = await import("@/lib/user-system-notifications");
        await notifyUser({
          userId: id,
          type: "company_added",
          title: `You've been added to ${company.name}`,
          message: `You have been assigned to the company ${company.name} by an administrator.`,
          metadata: {
            companyName: company.name,
            companyId: company_id,
          },
          emailRecipients: [oldUser?.email || email],
        });
      }
    }

    // Update public.users
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id);
      
      if (updateError) throw updateError;
    }

    // Update auth.users (email)
    if (email && email !== oldUser?.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: email,
        email_confirm: true,
      });
      if (authError) {
          // If not found in auth, skip email update there and just do public DB
          if (authError.message === 'User not found' || (authError as any).code === 'user_not_found') {
            console.warn("User not found in Auth to update email (skipping auth update):", id);
          } else {
            throw authError;
          }
      }

      // Sync email to public table manually if not handled by trigger
      await supabase.from("users").update({ email }).eq("id", id);
      updates.email = email;
    }

    // Log action
    await supabase.from("admin_audit_logs").insert({
      admin_id: admin.id,
      action: "EDIT_USER",
      target_resource: "users",
      target_id: id,
      details: {
          changes: updates,
          previous: {
            first_name: oldUser?.first_name,
            last_name: oldUser?.last_name,
            email: oldUser?.email
          }
      },
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

async function handleRestore(req: NextRequest, id: string, admin: any) {
    const supabase = createAdminClient();

    try {
        // 1. Clear deleted_at in public.users (Attempt only)
        try {
            const { error: dbError } = await supabase
                .from("users")
                .update({ deleted_at: null })
                .eq("id", id);
            
            if (dbError) {
                 console.warn("Restore in DB failed (likely missing column), proceeding to auth unban:", dbError.message);
            }
        } catch (e) {
             console.warn("Restore in DB failed:", e);
        }

        // 2. Unban in auth.users
        const { error: authError } = await supabase.auth.admin.updateUserById(id, {
            ban_duration: "0" // Remove ban
        });

        if (authError) {
             if (authError.message === 'User not found' || (authError as any).code === 'user_not_found') {
                 console.warn("User not found in Auth to unban (skipping):", id);
             } else {
                 throw authError;
             }
        }

        // 3. Log action
        await supabase.from("admin_audit_logs").insert({
            admin_id: admin.id,
            action: "RESTORE_USER",
            target_resource: "users",
            target_id: id,
            ip_address: req.headers.get("x-forwarded-for") || "unknown",
            user_agent: req.headers.get("user-agent"),
        });

        // 4. Notify User
        const { notifyUser } = await import("@/lib/user-system-notifications");
        await notifyUser({
            userId: id,
            type: "account_enabled",
            title: "Account Reactivated",
            message: "Your account has been reactivated. You can now log in."
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error restoring user:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to restore user" },
            { status: 500 }
        );
    }
}
