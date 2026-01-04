-- ============================================================================
-- Migration 037: Backfill User Company ID
-- Updates users.company_id based on company_admins table
-- ============================================================================

-- Update company_id for users who are company admins but have no company_id set
UPDATE users u
SET company_id = ca.company_id
FROM company_admins ca
WHERE u.id = ca.user_id
AND u.company_id IS NULL;

-- Also ensure that if a user is an 'owner', they are definitely correctly linked to their company
-- (Priority to owner role if user somehow has multiple admin entries, though app logic might not support that yet)
UPDATE users u
SET company_id = ca.company_id
FROM company_admins ca
WHERE u.id = ca.user_id
AND ca.role = 'owner'
AND (u.company_id IS NULL OR u.company_id != ca.company_id);
