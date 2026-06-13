-- portal_config.workspace_settings
CREATE TABLE portal_config.workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES identity.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(engagement_id, setting_key)
);

-- portal_config.white_label_configs
CREATE TABLE portal_config.white_label_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    domain TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    email_from_name TEXT,
    email_from_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- portal_config.api_keys
CREATE TABLE portal_config.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes JSONB NOT NULL DEFAULT '["read"]',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
