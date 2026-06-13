-- Digital Systems Readiness Assessment
CREATE TABLE interactive.assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interactive.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES interactive.assessment_templates(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    dimension TEXT NOT NULL, -- strategy, data, infrastructure, security, operations
    question_order INT NOT NULL,
    options JSONB NOT NULL, -- [{"label":"...","value":1,"weight":1.0}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interactive.assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES interactive.assessment_templates(id),
    email TEXT,
    organization TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
    answers JSONB NOT NULL DEFAULT '[]',
    scores JSONB,
    overall_score INT,
    recommendation_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_assessment_sessions_email ON interactive.assessment_sessions(email);
CREATE INDEX idx_assessment_sessions_status ON interactive.assessment_sessions(status);
CREATE INDEX idx_assessment_questions_template ON interactive.assessment_questions(template_id);
