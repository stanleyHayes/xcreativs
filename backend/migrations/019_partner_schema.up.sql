-- Reconcile the partner schema with the partner repository/domain model.
-- The partner.* tables (except partner.applications) were created outside the
-- migration history and did not match the repo/domain/frontend, which all
-- expect a richer model. All affected tables are empty, so we recreate them
-- cleanly. partner.applications already matches the code and is left intact.

-- partner.applications was originally created outside the migration history;
-- create it here (idempotently) so a fresh database reproduces the full schema.
-- partner.partners below references it, so it must exist first.
CREATE TABLE IF NOT EXISTS partner.applications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name         TEXT NOT NULL,
    org_website      TEXT NOT NULL DEFAULT '',
    contact_name     TEXT NOT NULL DEFAULT '',
    contact_email    TEXT NOT NULL DEFAULT '',
    contact_phone    TEXT,
    partner_type     TEXT NOT NULL DEFAULT 'technology',
    existing_product TEXT,
    domain_expertise TEXT,
    traction_metrics TEXT,
    what_they_need   TEXT,
    what_they_bring  TEXT,
    target_markets   TEXT[] NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL DEFAULT 'pending',
    reviewed_by      UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    reviewed_at      TIMESTAMPTZ,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS partner.distribution_orders CASCADE;
DROP TABLE IF EXISTS partner.referrals CASCADE;
DROP TABLE IF EXISTS partner.agreements CASCADE;
DROP TABLE IF EXISTS partner.products CASCADE;
DROP TABLE IF EXISTS partner.partner_users CASCADE;
DROP TABLE IF EXISTS partner.partners CASCADE;

CREATE TABLE partner.partners (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id    UUID REFERENCES partner.applications(id) ON DELETE SET NULL,
    org_name          TEXT NOT NULL,
    org_website       TEXT NOT NULL DEFAULT '',
    contact_name      TEXT NOT NULL DEFAULT '',
    contact_email     TEXT NOT NULL DEFAULT '',
    contact_phone     TEXT,
    partner_type      TEXT NOT NULL DEFAULT 'technology',
    tier              TEXT NOT NULL DEFAULT '',
    logo_url          TEXT,
    description       TEXT,
    target_markets    TEXT[] NOT NULL DEFAULT '{}',
    revenue_share_pct DOUBLE PRECISION,
    commission_pct    DOUBLE PRECISION,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partner.partner_users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (partner_id, user_id)
);

CREATE TABLE partner.products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id        UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL DEFAULT '',
    description       TEXT,
    status            TEXT NOT NULL DEFAULT 'active',
    development_stage TEXT,
    launch_date       DATE,
    revenue_share_pct DOUBLE PRECISION,
    ip_ownership_split TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partner.agreements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id  UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    document_url TEXT,
    signed_at   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    terms       JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partner.referrals (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id             UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    referred_org_name      TEXT NOT NULL DEFAULT '',
    referred_contact_name  TEXT,
    referred_contact_email TEXT,
    referred_contact_phone TEXT,
    opportunity_value      DOUBLE PRECISION,
    status                 TEXT NOT NULL DEFAULT 'new',
    converted_at           TIMESTAMPTZ,
    commission_amount      DOUBLE PRECISION,
    notes                  TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partner.distribution_orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id       UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    product_id       UUID REFERENCES partner.products(id) ON DELETE SET NULL,
    order_ref        TEXT,
    customer_name    TEXT,
    customer_email   TEXT,
    quantity         INTEGER,
    unit_price       DOUBLE PRECISION,
    total_value      DOUBLE PRECISION,
    commission_amount DOUBLE PRECISION,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partner.partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner.partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner.partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner.products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner_id ON partner.agreements(partner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_partner_id ON partner.referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_distribution_orders_partner_id ON partner.distribution_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner.applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner.applications(status);
