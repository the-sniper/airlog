-- Admin Audit Logs table
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES super_admins(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_resource VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (via API)
CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Only service role can view (via API for now)
CREATE POLICY "Service role can view audit logs" ON admin_audit_logs
    FOR SELECT
    USING (true);
