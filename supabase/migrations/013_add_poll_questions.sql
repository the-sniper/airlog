-- Poll question types: 'radio' (single choice), 'checkbox' (multiple choice)
CREATE TYPE poll_question_type AS ENUM ('radio', 'checkbox');

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

-- Create indexes
CREATE INDEX idx_poll_questions_scene_id ON poll_questions(scene_id);
CREATE INDEX idx_poll_responses_poll_question_id ON poll_responses(poll_question_id);
CREATE INDEX idx_poll_responses_tester_id ON poll_responses(tester_id);

-- Enable Row Level Security
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Policies for poll_questions
CREATE POLICY "Poll questions are viewable by everyone" ON poll_questions
    FOR SELECT USING (true);

CREATE POLICY "Poll questions can be created by anyone" ON poll_questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Poll questions can be updated by anyone" ON poll_questions
    FOR UPDATE USING (true);

CREATE POLICY "Poll questions can be deleted by anyone" ON poll_questions
    FOR DELETE USING (true);

-- Policies for poll_responses
CREATE POLICY "Poll responses are viewable by everyone" ON poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Poll responses can be created by anyone" ON poll_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Poll responses can be updated by anyone" ON poll_responses
    FOR UPDATE USING (true);

CREATE POLICY "Poll responses can be deleted by anyone" ON poll_responses
    FOR DELETE USING (true);
