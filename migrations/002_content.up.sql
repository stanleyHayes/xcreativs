-- content.pages: CMS-managed pages (home, about, etc.)
CREATE TABLE content.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    meta_description TEXT,
    meta_description_fr TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.services: service lines
CREATE TABLE content.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    service_line service_line NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    summary TEXT NOT NULL,
    summary_fr TEXT,
    methodology JSONB NOT NULL DEFAULT '[]',
    deliverables JSONB NOT NULL DEFAULT '[]',
    indicative_timeline TEXT,
    indicative_price_band TEXT,
    faqs JSONB NOT NULL DEFAULT '[]',
    hero_image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.labs_products
CREATE TABLE content.labs_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_fr TEXT,
    tagline TEXT NOT NULL,
    tagline_fr TEXT,
    problem_statement TEXT NOT NULL,
    problem_statement_fr TEXT,
    platform_description TEXT NOT NULL,
    platform_description_fr TEXT,
    technical_architecture_overview TEXT,
    sectors JSONB NOT NULL DEFAULT '[]',
    screenshots JSONB NOT NULL DEFAULT '[]',
    request_access_form JSONB NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.subsidiaries
CREATE TABLE content.subsidiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_fr TEXT,
    description TEXT NOT NULL,
    description_fr TEXT,
    status TEXT NOT NULL DEFAULT 'in_formation', -- planned, in_formation, active
    leadership JSONB NOT NULL DEFAULT '[]',
    relationship_to_parent TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.case_dossiers
CREATE TABLE content.case_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    client_name TEXT,
    industry industry_sector,
    service_line service_line,
    scale TEXT,
    stage TEXT,
    brief TEXT NOT NULL,
    brief_fr TEXT,
    constraint_set TEXT,
    constraint_set_fr TEXT,
    architecture_chosen TEXT,
    architecture_chosen_fr TEXT,
    what_shipped TEXT NOT NULL,
    what_shipped_fr TEXT,
    ip_retained TEXT,
    ip_retained_fr TEXT,
    learnings TEXT,
    learnings_fr TEXT,
    anonymized BOOLEAN NOT NULL DEFAULT FALSE,
    cover_image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.industries
CREATE TABLE content.industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    sector industry_sector NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    description TEXT NOT NULL,
    description_fr TEXT,
    capability_mapping JSONB NOT NULL DEFAULT '[]',
    relevant_dossier_slugs JSONB NOT NULL DEFAULT '[]',
    intake_cta_text TEXT,
    intake_cta_text_fr TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.insights
CREATE TABLE content.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    content_type content_type NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    summary TEXT,
    summary_fr TEXT,
    body TEXT NOT NULL,
    body_fr TEXT,
    author_name TEXT NOT NULL,
    author_title TEXT,
    tags JSONB NOT NULL DEFAULT '[]',
    is_gated BOOLEAN NOT NULL DEFAULT FALSE,
    gated_pdf_url TEXT,
    audio_url TEXT,
    published_at TIMESTAMPTZ,
    status content_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.glossary
CREATE TABLE content.glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT UNIQUE NOT NULL,
    term_fr TEXT,
    definition TEXT NOT NULL,
    definition_fr TEXT,
    related_terms JSONB NOT NULL DEFAULT '[]',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.faqs
CREATE TABLE content.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    category_fr TEXT,
    question TEXT NOT NULL,
    question_fr TEXT,
    answer TEXT NOT NULL,
    answer_fr TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.press_releases
CREATE TABLE content.press_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    body TEXT NOT NULL,
    body_fr TEXT,
    published_at TIMESTAMPTZ,
    is_coverage BOOLEAN NOT NULL DEFAULT FALSE,
    source_name TEXT,
    source_url TEXT,
    status content_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content.media_kit
CREATE TABLE content.media_kit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type TEXT NOT NULL, -- logo, headshot, one_pager, brand_guidelines
    name TEXT NOT NULL,
    download_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_case_dossiers_industry ON content.case_dossiers(industry);
CREATE INDEX idx_case_dossiers_service ON content.case_dossiers(service_line);
CREATE INDEX idx_insights_type ON content.insights(content_type);
CREATE INDEX idx_insights_published ON content.insights(published_at) WHERE status = 'published';
CREATE INDEX idx_insights_tags ON content.insights USING GIN(tags);
