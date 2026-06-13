-- AI Concierge RAG retrieval corpus (agent_plan.md §5.3): the firm's CMS content
-- chunked + full-text indexed for retrieval-augmented answers with citations.
CREATE TABLE IF NOT EXISTS interactive.knowledge_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,            -- service | insight | case_dossier | labs_product | industry | faq
    source_slug TEXT NOT NULL DEFAULT '',
    title       TEXT NOT NULL DEFAULT '',
    url         TEXT NOT NULL DEFAULT '',
    content     TEXT NOT NULL,
    tsv         TSVECTOR GENERATED ALWAYS AS (
                    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
                ) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tsv ON interactive.knowledge_chunks USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON interactive.knowledge_chunks(source_type, source_slug);
