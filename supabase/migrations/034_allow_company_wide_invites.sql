-- ============================================================================
-- Migration: Allow null email for company-wide invites
-- This enables creating reusable invite links for anyone to join a company
-- ============================================================================

-- Make email nullable to allow company-wide invites
ALTER TABLE company_user_invites ALTER COLUMN email DROP NOT NULL;

-- Drop the unique constraint that includes email (can't have NULL in unique constraints with email)
ALTER TABLE company_user_invites DROP CONSTRAINT IF EXISTS company_user_invites_company_id_email_status_key;

-- Add partial unique index that only applies when email is NOT NULL
-- This prevents duplicate pending invites to same email for same company
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_user_invites_unique_email 
  ON company_user_invites(company_id, email, status) 
  WHERE email IS NOT NULL;

-- Allow only one pending company-wide invite (null email) per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_user_invites_unique_company_wide
  ON company_user_invites(company_id, status)
  WHERE email IS NULL AND status = 'pending';
