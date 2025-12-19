-- Add invite_sent_at column to track when email invites were sent to testers
ALTER TABLE testers ADD COLUMN invite_sent_at TIMESTAMPTZ;

-- Add index for potential filtering by invite status
CREATE INDEX idx_testers_invite_sent_at ON testers(invite_sent_at);
