-- Add last_login_at column to users table for tracking login activity
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient queries on login activity (e.g., finding recently active users)
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Comment for documentation
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the user''s most recent login';
