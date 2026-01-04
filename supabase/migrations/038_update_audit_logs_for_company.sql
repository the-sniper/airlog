-- ============================================================================
-- Migration 038: Update Audit Logs for Company
-- Adds support for company admin actions in audit logs
-- ============================================================================

-- Add new columns to admin_audit_logs
ALTER TABLE admin_audit_logs
ADD COLUMN IF NOT EXISTS company_admin_id UUID REFERENCES company_admins(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for company_id
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_company_id ON admin_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_company_admin_id ON admin_audit_logs(company_admin_id);

-- Update RLS policies to allow company admins to view their own company logs (optional but good for future)
-- For now sticking to service role, but ensuring structure exists.
