-- Stakeholder Map (agent_plan.md §4.3): editable stakeholder graph per engagement.
CREATE TABLE IF NOT EXISTS engagement.stakeholders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT '',
    organization  TEXT NOT NULL DEFAULT '',
    influence     TEXT NOT NULL DEFAULT 'medium',   -- low | medium | high
    interest      TEXT NOT NULL DEFAULT 'medium',   -- low | medium | high
    sentiment     TEXT NOT NULL DEFAULT 'neutral',  -- supporter | neutral | skeptic | blocker
    notes         TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stakeholders_engagement_id ON engagement.stakeholders(engagement_id);
