-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'service_health', 'resource_usage', 'session_activity', 'user_management', 'data_quality', 'performance', 'security'
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Create index for faster queries
CREATE INDEX idx_notifications_severity ON notifications(severity);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create admin notification preferences table
CREATE TABLE IF NOT EXISTS admin_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL UNIQUE,
  email_critical BOOLEAN DEFAULT TRUE,
  email_warning BOOLEAN DEFAULT TRUE,
  email_info BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default preferences
INSERT INTO admin_notification_preferences (admin_email, email_critical, email_warning, email_info)
VALUES ('areefsyed96@gmail.com', TRUE, TRUE, FALSE)
ON CONFLICT (admin_email) DO NOTHING;
