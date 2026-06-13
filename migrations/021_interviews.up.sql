-- Applicant tracking: interview scheduling (agent_plan.md §4.4).
CREATE TABLE IF NOT EXISTS talent.interviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id    UUID NOT NULL REFERENCES talent.applications(id) ON DELETE CASCADE,
    interview_type    TEXT NOT NULL DEFAULT 'phone',     -- phone | technical | onsite | final
    scheduled_at      TIMESTAMPTZ NOT NULL,
    duration_minutes  INTEGER NOT NULL DEFAULT 45,
    location          TEXT NOT NULL DEFAULT '',          -- meeting URL or physical location
    interviewer_names JSONB NOT NULL DEFAULT '[]',
    status            TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | completed | cancelled | no_show
    feedback          TEXT NOT NULL DEFAULT '',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON talent.interviews(application_id);
