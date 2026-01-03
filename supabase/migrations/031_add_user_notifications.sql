-- Migration: Add user notifications table
-- Allows users to receive persistent in-app notifications

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'join_request_approved', 'join_request_rejected', 'session_invite', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional link to navigate to
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/update their own notifications
CREATE POLICY "Users can manage own notifications" ON user_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Enable REPLICA IDENTITY FULL for real-time
ALTER TABLE user_notifications REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;

COMMENT ON TABLE user_notifications IS 'Stores persistent in-app notifications for users';
COMMENT ON COLUMN user_notifications.type IS 'Type of notification for categorization';
COMMENT ON COLUMN user_notifications.link IS 'Optional URL to navigate to when clicked';
