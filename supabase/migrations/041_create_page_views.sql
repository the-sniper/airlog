CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES users(id),
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);

-- Add RLS policies (optional, but good practice)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for tracking)
CREATE POLICY "Allow public insert to page_views"
    ON page_views FOR INSERT
    WITH CHECK (true);

-- Allow admin select (assuming admin has access to everything via service role or admin policy)
-- But for now we rely on service role in API.
