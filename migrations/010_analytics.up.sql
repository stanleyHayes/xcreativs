-- Analytics events table for frontend tracking and admin dashboard
CREATE TABLE identity.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    visitor_id TEXT,
    user_id UUID REFERENCES identity.users(id),
    page_path TEXT,
    session_id TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON identity.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON identity.analytics_events(created_at);
CREATE INDEX idx_analytics_events_visitor ON identity.analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_user ON identity.analytics_events(user_id);
CREATE INDEX idx_analytics_events_page ON identity.analytics_events(page_path);
