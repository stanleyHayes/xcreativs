-- Layer 06: Annotated Bibliography, Audio Briefs, Webinars

-- content.reading_list_items: curated external readings with XCreativs annotations
CREATE TABLE content.reading_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    source_publication TEXT,
    source_url TEXT,
    published_year INT,
    annotation TEXT NOT NULL,
    key_takeaway TEXT,
    category TEXT NOT NULL DEFAULT 'general', -- strategy, technology, governance, design, operations
    tags JSONB NOT NULL DEFAULT '[]',
    cover_image_url TEXT,
    read_time_minutes INT,
    recommended BOOLEAN NOT NULL DEFAULT FALSE,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.audio_briefs: short-form audio content
CREATE TABLE content.audio_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    duration_seconds INT NOT NULL,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    speaker_name TEXT NOT NULL,
    speaker_title TEXT,
    tags JSONB NOT NULL DEFAULT '[]',
    cover_image_url TEXT,
    published_at TIMESTAMPTZ,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.webinars: live and recorded webinar events
CREATE TABLE content.webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    recording_url TEXT,
    registration_url TEXT,
    max_attendees INT,
    speaker_names JSONB NOT NULL DEFAULT '[]',
    tags JSONB NOT NULL DEFAULT '[]',
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, live, recorded, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.webinar_registrations: attendee registrations
CREATE TABLE content.webinar_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES content.webinars(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization TEXT,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(webinar_id, email)
);

-- Indexes
CREATE INDEX idx_reading_list_category ON content.reading_list_items(category);
CREATE INDEX idx_reading_list_status ON content.reading_list_items(status);
CREATE INDEX idx_reading_list_recommended ON content.reading_list_items(recommended) WHERE recommended = TRUE;
CREATE INDEX idx_reading_list_tags ON content.reading_list_items USING GIN(tags);

CREATE INDEX idx_audio_briefs_status ON content.audio_briefs(status);
CREATE INDEX idx_audio_briefs_published ON content.audio_briefs(published_at) WHERE status = 'published';
CREATE INDEX idx_audio_briefs_tags ON content.audio_briefs USING GIN(tags);

CREATE INDEX idx_webinars_status ON content.webinars(status);
CREATE INDEX idx_webinars_scheduled ON content.webinars(scheduled_at);
CREATE INDEX idx_webinar_registrations_webinar ON content.webinar_registrations(webinar_id);
