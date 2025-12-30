-- Function to get database size
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Grant access to authenticated users (admin only would need RLS/checks)
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_size() TO service_role;
