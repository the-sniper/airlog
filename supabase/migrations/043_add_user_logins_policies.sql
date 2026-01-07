-- Add RLS policy for service role access to user_logins table
-- This ensures the analytics queries can access the data

-- Policy to allow service role to read all user_logins
CREATE POLICY "Service role can read all user_logins" ON user_logins
  FOR SELECT
  USING (true);

-- Policy to allow service role to insert user_logins  
CREATE POLICY "Service role can insert user_logins" ON user_logins
  FOR INSERT
  WITH CHECK (true);
