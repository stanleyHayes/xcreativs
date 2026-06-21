-- comms.threads
CREATE TABLE comms.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    parent_type TEXT NOT NULL,
    parent_id UUID NOT NULL,
    title TEXT,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- comms.comments
CREATE TABLE comms.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES comms.threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES identity.users(id),
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- comms.notifications
CREATE TABLE comms.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    notification_type TEXT NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- comms.activity_feed
CREATE TABLE comms.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES identity.users(id),
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_engagement ON comms.threads(engagement_id);
CREATE INDEX idx_comments_thread ON comms.comments(thread_id);
CREATE INDEX idx_notifications_user ON comms.notifications(user_id);
CREATE INDEX idx_activity_feed_engagement ON comms.activity_feed(engagement_id);
