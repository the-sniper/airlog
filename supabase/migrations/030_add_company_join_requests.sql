-- Migration: Add company join requests table
-- Allows users to request to join a company during signup

-- Create company_join_requests table
CREATE TABLE IF NOT EXISTS company_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES company_admins(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    UNIQUE(company_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_join_requests_company_id ON company_join_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_company_join_requests_user_id ON company_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_company_join_requests_status ON company_join_requests(status);

-- Add allow_join_requests column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS allow_join_requests BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE company_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for now, real access control is at API layer)
CREATE POLICY "Allow all access to company_join_requests" ON company_join_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Enable REPLICA IDENTITY FULL for real-time UPDATE events to include old values
ALTER TABLE company_join_requests REPLICA IDENTITY FULL;

-- Add table to Supabase realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE company_join_requests;

COMMENT ON TABLE company_join_requests IS 'Stores user requests to join a company during signup';
COMMENT ON COLUMN company_join_requests.status IS 'pending, approved, or rejected';
COMMENT ON COLUMN companies.allow_join_requests IS 'Whether the company allows users to request to join during signup';

