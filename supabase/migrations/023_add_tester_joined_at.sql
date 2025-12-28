-- Add joined_at column to track when a tester actually joins a session
-- This is distinct from user_id which indicates the tester has a user account,
-- but doesn't mean they've actually accessed/joined the session

ALTER TABLE testers ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NULL;

-- Note: Existing testers who have user_id set may or may not have actually joined.
-- We're not backfilling this field - it will only be set going forward when
-- users actually access/join a session.
