-- Add invite_token to teams table
ALTER TABLE teams ADD COLUMN invite_token VARCHAR(20) UNIQUE;

-- Generate tokens for existing teams
UPDATE teams SET invite_token = SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12) WHERE invite_token IS NULL;

-- Make invite_token NOT NULL after populating existing rows
ALTER TABLE teams ALTER COLUMN invite_token SET NOT NULL;

-- Add default value for new teams
ALTER TABLE teams ALTER COLUMN invite_token SET DEFAULT SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12);

-- Create index for invite token lookups
CREATE INDEX idx_teams_invite_token ON teams(invite_token);

