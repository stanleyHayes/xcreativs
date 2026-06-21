-- Webhook subscriptions for external integrations
CREATE TABLE IF NOT EXISTS portal_config.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON portal_config.webhook_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_events ON portal_config.webhook_subscriptions USING gin(events);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS portal_config.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES portal_config.webhook_subscriptions(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription ON portal_config.webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON portal_config.webhook_deliveries(created_at);
