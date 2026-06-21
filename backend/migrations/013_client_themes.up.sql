-- White-label client themes
CREATE TABLE portal_config.client_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL UNIQUE REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    primary_color TEXT NOT NULL DEFAULT '#0066CC',
    secondary_color TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    email_from_name TEXT,
    email_from_address TEXT,
    custom_css TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_themes_engagement ON portal_config.client_themes(engagement_id);
