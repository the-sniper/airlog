-- Add deleted_at column to users for soft delete
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for filtering active/deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Update RLS policies to respect soft delete?
-- Optionally, we can hide deleted users from general queries using policy
-- But admins (service role) bypass RLS anyway.
-- For now, we'll filter in the application layer or update policies if strictness is needed.
