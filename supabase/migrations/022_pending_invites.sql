-- Create pending_invites table for tracking invitations to unregistered users
CREATE TABLE IF NOT EXISTS pending_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invite_type VARCHAR(50) NOT NULL CHECK (invite_type IN ('session', 'team')),
    target_id UUID NOT NULL, -- session_id or team_id depending on invite_type
    invited_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    claimed_at TIMESTAMPTZ,
    UNIQUE(email, invite_type, target_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_target ON pending_invites(invite_type, target_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_expires ON pending_invites(expires_at) WHERE claimed_at IS NULL;

-- Enable RLS with open policies (consistent with other tables)
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pending invites are viewable by everyone" ON pending_invites
    FOR SELECT USING (true);

CREATE POLICY "Pending invites can be created by anyone" ON pending_invites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Pending invites can be updated by anyone" ON pending_invites
    FOR UPDATE USING (true);

CREATE POLICY "Pending invites can be deleted by anyone" ON pending_invites
    FOR DELETE USING (true);
