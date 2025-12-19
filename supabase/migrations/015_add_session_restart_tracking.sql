-- Add restart tracking columns to sessions table
ALTER TABLE sessions ADD COLUMN first_ended_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN last_restarted_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN restart_count INTEGER NOT NULL DEFAULT 0;
