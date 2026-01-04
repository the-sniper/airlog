-- ============================================================================
-- Migration 039: Backfill Teams Company ID
-- Associates existing teams with companies based on their members
-- ============================================================================

-- Update teams with company_id based on their members
-- We use a heuristic: prioritize the company of the oldest team member (likely the creator)
-- If a team has members from multiple companies, this picks the first one found based on member creation order.

WITH team_companies AS (
    SELECT DISTINCT ON (tm.team_id)
        tm.team_id,
        u.company_id
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.user_id IS NOT NULL 
    AND u.company_id IS NOT NULL
    ORDER BY tm.team_id, tm.created_at ASC
)
UPDATE teams t
SET company_id = tc.company_id
FROM team_companies tc
WHERE t.id = tc.team_id
AND t.company_id IS NULL;

-- Optional: If you want to force all specific named teams to a specific company (manual override example)
-- UPDATE teams SET company_id = '...' WHERE name = 'Engineering' AND company_id IS NULL;
