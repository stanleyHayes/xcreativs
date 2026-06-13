-- talent.job_roles
CREATE TABLE talent.job_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    department TEXT NOT NULL,
    location TEXT,
    is_remote_friendly BOOLEAN NOT NULL DEFAULT TRUE,
    employment_type TEXT NOT NULL DEFAULT 'full_time',
    summary TEXT NOT NULL,
    summary_fr TEXT,
    responsibilities JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '[]',
    compensation_philosophy TEXT,
    growth_trajectory TEXT,
    project_examples JSONB NOT NULL DEFAULT '[]',
    team_description TEXT,
    application_process TEXT,
    expected_start_window TEXT,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- talent.applications
CREATE TABLE talent.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES talent.job_roles(id) ON DELETE SET NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    answers JSONB NOT NULL DEFAULT '{}',
    status application_status NOT NULL DEFAULT 'received',
    notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- talent.talent_network
CREATE TABLE talent.talent_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    domains JSONB NOT NULL DEFAULT '[]', -- engineering, ai_ml, design, product, strategy, public_policy
    seniority_level TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- talent.internship_programs
CREATE TABLE talent.internship_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_fr TEXT,
    program_type TEXT NOT NULL, -- internship, fellowship
    duration_months INT NOT NULL,
    description TEXT NOT NULL,
    description_fr TEXT,
    learning_outcomes JSONB NOT NULL DEFAULT '[]',
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    application_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_role ON talent.applications(role_id);
CREATE INDEX idx_applications_status ON talent.applications(status);
CREATE INDEX idx_applications_email ON talent.applications(applicant_email);
