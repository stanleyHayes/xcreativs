-- Phase C partner features (agent_plan.md §5.1): co-development workspace +
-- distribution training. Regional performance / commission are aggregated from
-- existing referrals + distribution_orders, so no extra table is needed there.

-- Co-development workspace: per-product engagement-style work items.
CREATE TABLE IF NOT EXISTS partner.codev_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES partner.products(id) ON DELETE CASCADE,
    item_type   TEXT NOT NULL DEFAULT 'task',   -- milestone | task | update | blocker
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'open',    -- open | in_progress | done | blocked
    owner       TEXT NOT NULL DEFAULT '',
    due_date    DATE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_codev_items_product_id ON partner.codev_items(product_id);

-- Distribution partner training.
CREATE TABLE IF NOT EXISTS partner.training_modules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             TEXT NOT NULL UNIQUE,
    title            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    content_url      TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner.training_completions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id   UUID NOT NULL REFERENCES partner.partners(id) ON DELETE CASCADE,
    module_id    UUID NOT NULL REFERENCES partner.training_modules(id) ON DELETE CASCADE,
    score        INTEGER,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (partner_id, module_id)
);
