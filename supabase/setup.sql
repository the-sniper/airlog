-- ============================================================================
-- Echo Test Database Setup
-- Complete schema for setting up a new database from scratch
-- Combines all migrations: 001-015
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE session_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE note_category AS ENUM ('bug', 'feature', 'ux', 'performance', 'other');
CREATE TYPE poll_question_type AS ENUM ('radio', 'checkbox');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Sessions table (includes columns from migrations 003, 009, 011, 012, 015)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    build_version VARCHAR(100),
    status session_status NOT NULL DEFAULT 'draft',
    description TEXT,
    ai_summary TEXT,
    share_token VARCHAR(50) UNIQUE,
    issue_options JSONB DEFAULT '[]'::jsonb,
    first_ended_at TIMESTAMPTZ,
    last_restarted_at TIMESTAMPTZ,
    restart_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Scenes table (includes columns from migration 002)
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Teams table (includes columns from migration 007)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    invite_token VARCHAR(20) NOT NULL UNIQUE DEFAULT SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testers table (uses updated schema from migration 005, includes 010, 012)
CREATE TABLE testers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    invite_token VARCHAR(50) NOT NULL UNIQUE,
    invite_sent_at TIMESTAMPTZ,
    reported_issues JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notes table (includes column from migration 008)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    tester_id UUID NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
    audio_url TEXT,
    raw_transcript TEXT,
    edited_transcript TEXT,
    category note_category NOT NULL DEFAULT 'other',
    auto_classified BOOLEAN NOT NULL DEFAULT false,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Users table with single admin constraint
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Constraint to ensure only one admin can exist
CREATE UNIQUE INDEX single_admin_constraint ON admin_users ((true));

-- Admin sessions table for token management
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Poll questions table (linked to scenes)
CREATE TABLE poll_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type poll_question_type NOT NULL DEFAULT 'radio',
    options TEXT[] NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Poll responses table (tester answers to poll questions)
CREATE TABLE poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_question_id UUID NOT NULL REFERENCES poll_questions(id) ON DELETE CASCADE,
    tester_id UUID NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
    selected_options TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_question_id, tester_id)
);

-- Deleted notes tracking table
CREATE TABLE deleted_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_note_id UUID NOT NULL,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    scene_id UUID,
    tester_id UUID,
    audio_url TEXT,
    raw_transcript TEXT,
    edited_transcript TEXT,
    category note_category NOT NULL,
    deletion_reason TEXT NOT NULL,
    deleted_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    deleted_by_email VARCHAR(255),
    original_created_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Sessions indexes
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_share_token ON sessions(share_token);

-- Scenes indexes
CREATE INDEX idx_scenes_session_id ON scenes(session_id);

-- Teams indexes
CREATE INDEX idx_teams_invite_token ON teams(invite_token);

-- Team members indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_email ON team_members(email);

-- Testers indexes
CREATE INDEX idx_testers_session_id ON testers(session_id);
CREATE INDEX idx_testers_invite_token ON testers(invite_token);
CREATE INDEX idx_testers_email ON testers(email);
CREATE INDEX idx_testers_invite_sent_at ON testers(invite_sent_at);

-- Notes indexes
CREATE INDEX idx_notes_session_id ON notes(session_id);
CREATE INDEX idx_notes_scene_id ON notes(scene_id);
CREATE INDEX idx_notes_tester_id ON notes(tester_id);
CREATE INDEX idx_notes_category ON notes(category);

-- Admin sessions indexes
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Poll questions indexes
CREATE INDEX idx_poll_questions_scene_id ON poll_questions(scene_id);

-- Poll responses indexes
CREATE INDEX idx_poll_responses_poll_question_id ON poll_responses(poll_question_id);
CREATE INDEX idx_poll_responses_tester_id ON poll_responses(tester_id);

-- Deleted notes indexes
CREATE INDEX idx_deleted_notes_session_id ON deleted_notes(session_id);
CREATE INDEX idx_deleted_notes_deleted_at ON deleted_notes(deleted_at);
CREATE INDEX idx_deleted_notes_deleted_by ON deleted_notes(deleted_by_admin_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Sessions policies
CREATE POLICY "Sessions are viewable by everyone" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Sessions can be created by anyone" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions can be updated by anyone" ON sessions
    FOR UPDATE USING (true);

-- Scenes policies
CREATE POLICY "Scenes are viewable by everyone" ON scenes
    FOR SELECT USING (true);

CREATE POLICY "Scenes can be created by anyone" ON scenes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Scenes can be updated by anyone" ON scenes
    FOR UPDATE USING (true);

CREATE POLICY "Scenes can be deleted by anyone" ON scenes
    FOR DELETE USING (true);

-- Testers policies
CREATE POLICY "Testers are viewable by everyone" ON testers
    FOR SELECT USING (true);

CREATE POLICY "Testers can be created by anyone" ON testers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Testers can be updated by anyone" ON testers
    FOR UPDATE USING (true);

-- Notes policies
CREATE POLICY "Notes are viewable by everyone" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Notes can be created by anyone" ON notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Notes can be updated by anyone" ON notes
    FOR UPDATE USING (true);

-- Teams policies
CREATE POLICY "Teams are viewable by everyone" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Teams can be created by anyone" ON teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Teams can be updated by anyone" ON teams
    FOR UPDATE USING (true);

CREATE POLICY "Teams can be deleted by anyone" ON teams
    FOR DELETE USING (true);

-- Team members policies
CREATE POLICY "Team members are viewable by everyone" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Team members can be created by anyone" ON team_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Team members can be updated by anyone" ON team_members
    FOR UPDATE USING (true);

CREATE POLICY "Team members can be deleted by anyone" ON team_members
    FOR DELETE USING (true);

-- Admin policies (restrictive - only service role can access)
CREATE POLICY "Admin users only accessible by service role" ON admin_users
    FOR ALL USING (false);

CREATE POLICY "Admin sessions only accessible by service role" ON admin_sessions
    FOR ALL USING (false);

-- Poll questions policies
CREATE POLICY "Poll questions are viewable by everyone" ON poll_questions
    FOR SELECT USING (true);

CREATE POLICY "Poll questions can be created by anyone" ON poll_questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Poll questions can be updated by anyone" ON poll_questions
    FOR UPDATE USING (true);

CREATE POLICY "Poll questions can be deleted by anyone" ON poll_questions
    FOR DELETE USING (true);

-- Poll responses policies
CREATE POLICY "Poll responses are viewable by everyone" ON poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Poll responses can be created by anyone" ON poll_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Poll responses can be updated by anyone" ON poll_responses
    FOR UPDATE USING (true);

CREATE POLICY "Poll responses can be deleted by anyone" ON poll_responses
    FOR DELETE USING (true);

-- Deleted notes policies
CREATE POLICY "Deleted notes are viewable by everyone" ON deleted_notes
    FOR SELECT USING (true);

CREATE POLICY "Deleted notes can be created by anyone" ON deleted_notes
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE
-- ============================================================================

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for audio bucket
CREATE POLICY "Audio files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');

CREATE POLICY "Anyone can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-recordings');

