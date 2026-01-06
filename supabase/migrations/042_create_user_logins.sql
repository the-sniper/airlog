-- Create user_logins table to track each login event
-- This allows for accurate login activity tracking over time
CREATE TABLE IF NOT EXISTS user_logins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries on login activity by date
CREATE INDEX IF NOT EXISTS idx_user_logins_created_at ON user_logins(created_at);

-- Index for finding logins by user
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON user_logins(user_id);

-- Enable RLS
ALTER TABLE user_logins ENABLE ROW LEVEL SECURITY;

-- Allow admin access via service role (no direct public access needed)
COMMENT ON TABLE user_logins IS 'Records each user login event for analytics tracking';
