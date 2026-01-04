-- Add join_method to users table to track how they joined the company
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_method VARCHAR(50) DEFAULT 'signup';
-- Values: 'signup', 'invite', 'admin_add'

COMMENT ON COLUMN users.join_method IS 'How the user joined the company: signup (self-registered), invite (via email invite), admin_add (added directly by admin)';
