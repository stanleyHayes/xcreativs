-- NDA / e-signature infrastructure
CREATE TABLE lead_qual.signature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL DEFAULT 'nda', -- nda, mou, sow, amendment
    engagement_id UUID REFERENCES engagement.engagements(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_org TEXT,
    document_title TEXT NOT NULL,
    document_body TEXT NOT NULL,
    external_provider TEXT NOT NULL DEFAULT 'mock', -- docusign, dropbox_sign, mock
    external_request_id TEXT,
    signing_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, signed, declined, expired
    signed_at TIMESTAMPTZ,
    signed_document_url TEXT,
    created_by UUID NOT NULL REFERENCES identity.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_signature_requests_status ON lead_qual.signature_requests(status);
CREATE INDEX idx_signature_requests_engagement ON lead_qual.signature_requests(engagement_id);
CREATE INDEX idx_signature_requests_email ON lead_qual.signature_requests(recipient_email);
CREATE INDEX idx_signature_requests_created_by ON lead_qual.signature_requests(created_by);
