-- engagement.engagements
CREATE TABLE engagement.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES identity.users(id),
    client_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sector industry_sector,
    service_line service_line,
    stage engagement_stage NOT NULL DEFAULT 'active',
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    budget_total_usd DECIMAL(15,2),
    budget_total_ghs DECIMAL(15,2),
    budget_total_eur DECIMAL(15,2),
    currency_preference currency_code DEFAULT 'USD',
    is_white_label BOOLEAN NOT NULL DEFAULT FALSE,
    white_label_domain TEXT,
    white_label_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.milestones
CREATE TABLE engagement.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.deliverables
CREATE TABLE engagement.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    version INT NOT NULL DEFAULT 1,
    file_url TEXT,
    file_name TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    signature_status TEXT DEFAULT 'unsigned',
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES identity.users(id),
    visibility_role user_role NOT NULL DEFAULT 'project',
    status TEXT NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.decisions
CREATE TABLE engagement.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    rationale TEXT,
    alternatives_considered TEXT,
    decision_maker UUID REFERENCES identity.users(id),
    linked_artefacts JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'proposed',
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.risks
CREATE TABLE engagement.risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    owner UUID REFERENCES identity.users(id),
    mitigation_plan TEXT,
    residual_rating TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    escalation_status TEXT DEFAULT 'none',
    status TEXT NOT NULL DEFAULT 'open',
    linked_decision_id UUID REFERENCES engagement.decisions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.capability_deliveries
CREATE TABLE engagement.capability_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    capability_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    reason_deferred TEXT,
    delivered_at TIMESTAMPTZ,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.budget_lines
CREATE TABLE engagement.budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    allocated_usd DECIMAL(15,2),
    allocated_ghs DECIMAL(15,2),
    allocated_eur DECIMAL(15,2),
    spent_usd DECIMAL(15,2) DEFAULT 0,
    spent_ghs DECIMAL(15,2) DEFAULT 0,
    spent_eur DECIMAL(15,2) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.invoices
CREATE TABLE engagement.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    milestone_id UUID REFERENCES engagement.milestones(id),
    amount DECIMAL(15,2) NOT NULL,
    currency currency_code NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft',
    stripe_payment_link TEXT,
    paystack_payment_link TEXT,
    paid_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.approval_workflows
CREATE TABLE engagement.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES engagement.deliverables(id),
    title TEXT NOT NULL,
    approver_id UUID REFERENCES identity.users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    comments TEXT,
    rejected_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- engagement.reports
CREATE TABLE engagement.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    file_url TEXT,
    role_scope user_role NOT NULL DEFAULT 'executive',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.document_library
CREATE TABLE engagement.document_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT,
    role_scope user_role NOT NULL DEFAULT 'project',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.team_members
CREATE TABLE engagement.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES identity.users(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    availability_status TEXT DEFAULT 'available',
    is_xcreativs BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- engagement.support_tickets
CREATE TABLE engagement.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement.engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    requester_id UUID REFERENCES identity.users(id),
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    sla_target_hours INT,
    sla_breached BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engagements_client ON engagement.engagements(client_id);
CREATE INDEX idx_engagements_stage ON engagement.engagements(stage);
CREATE INDEX idx_milestones_engagement ON engagement.milestones(engagement_id);
CREATE INDEX idx_deliverables_engagement ON engagement.deliverables(engagement_id);
CREATE INDEX idx_decisions_engagement ON engagement.decisions(engagement_id);
CREATE INDEX idx_risks_engagement ON engagement.risks(engagement_id);
CREATE INDEX idx_capability_deliveries_engagement ON engagement.capability_deliveries(engagement_id);
CREATE INDEX idx_invoices_engagement ON engagement.invoices(engagement_id);
CREATE INDEX idx_approval_workflows_engagement ON engagement.approval_workflows(engagement_id);
