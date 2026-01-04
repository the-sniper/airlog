-- ============================================================================
-- Migration 027: Multi-Tenant Company System
-- Transforms AirLog from single-admin to multi-tenant platform
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE company_role AS ENUM ('owner', 'admin');

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Companies table (tenant organizations)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    max_teams INTEGER DEFAULT 3,
    max_sessions_per_month INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company admins table (admin users per company)
CREATE TABLE company_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role company_role NOT NULL DEFAULT 'admin',
    invited_by UUID REFERENCES company_admins(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Company admin sessions (authentication)
CREATE TABLE company_admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_admin_id UUID NOT NULL REFERENCES company_admins(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Rename admin_users to super_admins
ALTER TABLE admin_users RENAME TO super_admins;

-- Rename admin_id column in admin_sessions
ALTER TABLE admin_sessions RENAME COLUMN admin_id TO super_admin_id;

-- Rename the foreign key constraint
ALTER TABLE admin_sessions DROP CONSTRAINT IF EXISTS admin_sessions_admin_id_fkey;
ALTER TABLE admin_sessions 
    ADD CONSTRAINT admin_sessions_super_admin_id_fkey 
    FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE;

-- Drop single admin constraint to allow multiple super admins
DROP INDEX IF EXISTS single_admin_constraint;

-- Add company_id to teams
ALTER TABLE teams ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id and team_id to sessions
ALTER TABLE sessions ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Companies indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Company admins indexes
CREATE INDEX idx_company_admins_company ON company_admins(company_id);
CREATE INDEX idx_company_admins_user ON company_admins(user_id);
CREATE INDEX idx_company_admins_role ON company_admins(role);

-- Company admin sessions indexes
CREATE INDEX idx_company_admin_sessions_token ON company_admin_sessions(token_hash);
CREATE INDEX idx_company_admin_sessions_expires ON company_admin_sessions(expires_at);
CREATE INDEX idx_company_admin_sessions_admin ON company_admin_sessions(company_admin_id);

-- Teams company index
CREATE INDEX idx_teams_company ON teams(company_id);

-- Sessions company/team indexes
CREATE INDEX idx_sessions_company ON sessions(company_id);
CREATE INDEX idx_sessions_team ON sessions(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admin_sessions ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Companies are viewable by everyone" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Companies can be created by anyone" ON companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Companies can be updated by anyone" ON companies
    FOR UPDATE USING (true);

-- Company admins policies
CREATE POLICY "Company admins are viewable by everyone" ON company_admins
    FOR SELECT USING (true);

CREATE POLICY "Company admins can be created by anyone" ON company_admins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Company admins can be updated by anyone" ON company_admins
    FOR UPDATE USING (true);

CREATE POLICY "Company admins can be deleted by anyone" ON company_admins
    FOR DELETE USING (true);

-- Company admin sessions policies (restrictive)
CREATE POLICY "Company admin sessions only accessible by service role" ON company_admin_sessions
    FOR ALL USING (false);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate URL-friendly slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := LOWER(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'company';
    END IF;
    
    -- Check for uniqueness and append number if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired company admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_company_admin_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM company_admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
