-- Calendar booking / consultation requests
CREATE TABLE lead_qual.consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization TEXT,
    topic TEXT NOT NULL,
    preferred_date DATE,
    preferred_time TEXT,
    duration_minutes INT NOT NULL DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'requested', -- requested, confirmed, cancelled, completed, declined
    scheduled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_status ON lead_qual.consultation_bookings(status);
CREATE INDEX idx_bookings_email ON lead_qual.consultation_bookings(email);
CREATE INDEX idx_bookings_created ON lead_qual.consultation_bookings(created_at);
