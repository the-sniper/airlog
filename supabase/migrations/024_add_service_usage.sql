-- Service Usage Tracking Table
-- Tracks API calls to external services for usage monitoring

CREATE TABLE service_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,  -- 'openai', 'whisper', 'supabase', 'smtp'
  endpoint TEXT NOT NULL,      -- specific endpoint or operation
  tokens_used INTEGER,         -- for OpenAI: completion tokens
  prompt_tokens INTEGER,       -- for OpenAI: prompt tokens
  duration_ms INTEGER,         -- request duration in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,          -- error message if failed
  metadata JSONB,              -- additional context (model, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_service_usage_created_at ON service_usage(created_at DESC);
CREATE INDEX idx_service_usage_service ON service_usage(service_name);
CREATE INDEX idx_service_usage_service_date ON service_usage(service_name, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE service_usage IS 'Tracks API calls to external services (OpenAI, Whisper, SMTP) for usage monitoring and cost estimation';
