-- Phase B completion: notification preferences + digests, embedded demo links,
-- technical assessment challenges (agent_plan.md §4.3–§4.5).

-- Per-user notification preferences + digest options + channels.
CREATE TABLE IF NOT EXISTS comms.notification_preferences (
    user_id          UUID PRIMARY KEY REFERENCES identity.users(id) ON DELETE CASCADE,
    email_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    digest_frequency TEXT NOT NULL DEFAULT 'instant',  -- instant | daily | weekly | off
    phone            TEXT NOT NULL DEFAULT '',
    segments         JSONB NOT NULL DEFAULT '[]',       -- visitor | prospect | client | partner | candidate
    digest_last_sent_at TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Embedded demos: signed, time-limited SSO links to preview environments.
CREATE TABLE IF NOT EXISTS engagement.demo_links (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id    UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    label            TEXT NOT NULL,
    target_url       TEXT NOT NULL,
    token            TEXT NOT NULL UNIQUE,
    expires_at       TIMESTAMPTZ,
    created_by       UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    last_accessed_at TIMESTAMPTZ,
    access_count     INTEGER NOT NULL DEFAULT 0,
    is_revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_links_engagement_id ON engagement.demo_links(engagement_id);
CREATE INDEX IF NOT EXISTS idx_demo_links_token ON engagement.demo_links(token);

-- Technical assessment challenges for job applicants + their assignments.
CREATE TABLE IF NOT EXISTS talent.assessment_challenges (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              TEXT NOT NULL UNIQUE,
    title             TEXT NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    prompt            TEXT NOT NULL DEFAULT '',
    skills            JSONB NOT NULL DEFAULT '[]',
    time_limit_minutes INTEGER NOT NULL DEFAULT 120,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS talent.assessment_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES talent.applications(id) ON DELETE CASCADE,
    challenge_id    UUID NOT NULL REFERENCES talent.assessment_challenges(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'assigned',  -- assigned | submitted | reviewed
    access_token    TEXT NOT NULL UNIQUE,
    submission_url  TEXT NOT NULL DEFAULT '',
    submission_notes TEXT NOT NULL DEFAULT '',
    score           INTEGER,
    reviewer_notes  TEXT NOT NULL DEFAULT '',
    due_at          TIMESTAMPTZ,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_application_id ON talent.assessment_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_token ON talent.assessment_assignments(access_token);
