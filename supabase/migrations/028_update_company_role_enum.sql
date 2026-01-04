-- ============================================================================
-- Migration 028: Update company_role enum (remove manager)
-- Simplifies roles to just owner and admin
-- ============================================================================

-- Step 1: Update any existing 'manager' roles to 'admin'
UPDATE company_admins 
SET role = 'admin'::company_role 
WHERE role = 'manager'::company_role;

-- Step 2: Drop the default value on the role column
ALTER TABLE company_admins ALTER COLUMN role DROP DEFAULT;

-- Step 3: Create a new enum type without 'manager'
CREATE TYPE company_role_new AS ENUM ('owner', 'admin');

-- Step 4: Alter the column to use the new enum type
ALTER TABLE company_admins 
  ALTER COLUMN role TYPE company_role_new 
  USING role::text::company_role_new;

-- Step 5: Drop the old enum type
DROP TYPE company_role;

-- Step 6: Rename the new type to the original name
ALTER TYPE company_role_new RENAME TO company_role;

-- Step 7: Restore the default value with the new enum
ALTER TABLE company_admins ALTER COLUMN role SET DEFAULT 'admin'::company_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
