-- Add issue_options column to sessions table (admin-configurable checkboxes)
ALTER TABLE sessions ADD COLUMN issue_options JSONB DEFAULT '[]'::jsonb;

-- Add reported_issues column to testers table (selected checkboxes by tester)
ALTER TABLE testers ADD COLUMN reported_issues JSONB DEFAULT '[]'::jsonb;
