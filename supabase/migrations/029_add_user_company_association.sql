-- ============================================================================
-- Migration 029: User-Company Association
-- Links users to companies for company-scoped team management
-- ============================================================================

-- Add company_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Index for efficient company-scoped user queries
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- ============================================================================
-- Company User Invites
-- Pending invites for users to join a company
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_user_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES company_admins(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Prevent duplicate pending invites to same email for same company
    UNIQUE(company_id, email, status)
);

-- Indexes for company user invites
CREATE INDEX IF NOT EXISTS idx_company_user_invites_company ON company_user_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_user_invites_email ON company_user_invites(email);
CREATE INDEX IF NOT EXISTS idx_company_user_invites_token ON company_user_invites(token);
CREATE INDEX IF NOT EXISTS idx_company_user_invites_status ON company_user_invites(status);

-- Enable RLS
ALTER TABLE company_user_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now, API layer handles auth)
CREATE POLICY "Company user invites are viewable by everyone" ON company_user_invites
    FOR SELECT USING (true);

CREATE POLICY "Company user invites can be created by anyone" ON company_user_invites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Company user invites can be updated by anyone" ON company_user_invites
    FOR UPDATE USING (true);

CREATE POLICY "Company user invites can be deleted by anyone" ON company_user_invites
    FOR DELETE USING (true);

-- ============================================================================
-- Function to generate invite token
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_company_invite_token()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    token TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..24 LOOP
        token := token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Auto-associate users with company on signup if they have a pending invite
-- ============================================================================

CREATE OR REPLACE FUNCTION process_company_user_invite()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Look for a pending invite for this email
    SELECT * INTO invite_record
    FROM company_user_invites
    WHERE email = LOWER(NEW.email)
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update user with company_id
        NEW.company_id := invite_record.company_id;
        
        -- Mark invite as accepted
        UPDATE company_user_invites
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = invite_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_process_company_user_invite ON users;
CREATE TRIGGER trigger_process_company_user_invite
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION process_company_user_invite();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
