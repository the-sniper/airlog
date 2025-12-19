-- Add share_token column for public report sharing
ALTER TABLE sessions ADD COLUMN share_token VARCHAR(50) UNIQUE;

-- Create index for share_token lookups
CREATE INDEX idx_sessions_share_token ON sessions(share_token);
