-- lead_qual.diagnostics
CREATE TABLE lead_qual.diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    prospect_name TEXT,
    organization TEXT,
    sector industry_sector,
    answers JSONB NOT NULL DEFAULT '[]',
    routing diagnostic_routing,
    summary_pdf_url TEXT,
    indicative_scope TEXT,
    indicative_next_steps TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- lead_qual.diagnostic_questions
CREATE TABLE lead_qual.diagnostic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_key TEXT UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    question_text_fr TEXT,
    question_type TEXT NOT NULL DEFAULT 'single_choice', -- single_choice, multiple_choice, text, number
    options JSONB NOT NULL DEFAULT '[]',
    branching_rules JSONB NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- lead_qual.scope_estimates
CREATE TABLE lead_qual.scope_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    prospect_name TEXT,
    organization TEXT,
    service_line service_line,
    parameters JSONB NOT NULL DEFAULT '{}',
    components JSONB NOT NULL DEFAULT '[]',
    weeks_band TEXT,
    price_band_usd TEXT,
    price_band_ghs TEXT,
    sample_architecture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- lead_qual.rfp_submissions
CREATE TABLE lead_qual.rfp_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    deadline TIMESTAMPTZ,
    scope_summary TEXT,
    evaluation_criteria TEXT,
    submission_requirements TEXT,
    document_url TEXT,
    status TEXT NOT NULL DEFAULT 'received',
    assigned_to UUID,
    sla_acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- lead_qual.newsletter_subscribers
CREATE TABLE lead_qual.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    segments JSONB NOT NULL DEFAULT '["general"]',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diagnostics_email ON lead_qual.diagnostics(email);
CREATE INDEX idx_rfp_status ON lead_qual.rfp_submissions(status);
