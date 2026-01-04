import { createAdminClient } from "@/lib/supabase/server";

interface AuditLogEntry {
  action: string;
  target_resource: string;
  target_id: string;
  details?: any;
  admin_id?: string; // Super admin
  company_admin_id?: string; // Company admin
  company_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Logs an administrative action to the admin_audit_logs table.
 * Supports both super admins and company admins.
 */
export async function logAdminAction(entry: AuditLogEntry) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_audit_logs").insert(entry);
    
    if (error) {
      console.error("Failed to insert audit log:", error);
    }
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}
