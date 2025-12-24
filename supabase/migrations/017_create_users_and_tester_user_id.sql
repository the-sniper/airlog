-- Create users table to allow registration/login
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable row level security and align with current open policies (to be tightened later)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can be created by anyone" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated by anyone" ON users
    FOR UPDATE USING (true);

-- Link testers to users for consistent identification across sessions
ALTER TABLE testers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_testers_user_id ON testers(user_id);

-- Backfill users from existing team_members
INSERT INTO users (first_name, last_name, email, password_hash, created_at)
SELECT DISTINCT
    tm.first_name,
    tm.last_name,
    tm.email,
    -- Placeholder hash; real auth flow should set a proper hash on first login/reset
    'TEMP_PASSWORD_HASH',
    COALESCE(tm.created_at, NOW())
FROM team_members tm
WHERE tm.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;
