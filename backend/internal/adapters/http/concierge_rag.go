package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// Retrieval-augmented concierge (agent_plan.md §5.3). Retrieval is over the
// firm's CMS corpus via Postgres full-text ranking; generation is grounded —
// extractive by default, or generative when an LLM provider is configured.

type ragChunk struct {
	SourceType string
	Slug       string
	Title      string
	URL        string
	Content    string
	Rank       float64
}

// reindexKnowledgeCorpus rebuilds interactive.knowledge_chunks from published
// CMS content. Returns the number of chunks indexed.
func reindexKnowledgeCorpus(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	if _, err := pool.Exec(ctx, `TRUNCATE interactive.knowledge_chunks`); err != nil {
		return 0, err
	}
	statements := []string{
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'service', slug, title, '/services/'||slug,
		        concat_ws(' — ', COALESCE(summary,''), COALESCE(methodology::text,''), COALESCE(deliverables::text,''))
		 FROM content.services WHERE status = 'published'`,
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'insight', slug, title, '/insights/'||slug, concat_ws(' ', COALESCE(summary,''), COALESCE(body,''))
		 FROM content.insights WHERE status = 'published'`,
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'case_dossier', slug, title, '/work/'||slug,
		        concat_ws(' ', COALESCE(brief,''), COALESCE(what_shipped,''), COALESCE(architecture_chosen,''))
		 FROM content.case_dossiers WHERE status = 'published'`,
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'labs_product', slug, name, '/labs/'||slug,
		        concat_ws(' ', COALESCE(tagline,''), COALESCE(problem_statement,''), COALESCE(platform_description,''))
		 FROM content.labs_products WHERE status = 'published'`,
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'industry', slug, title, '/industries/'||slug, COALESCE(description,'')
		 FROM content.industries WHERE status = 'published'`,
		`INSERT INTO interactive.knowledge_chunks (source_type, source_slug, title, url, content)
		 SELECT 'faq', '', question, '/faq', COALESCE(answer,'') FROM content.faqs`,
	}
	for _, s := range statements {
		// Best-effort per source: a schema variance in one table must not abort the rest.
		_, _ = pool.Exec(ctx, s)
	}
	var n int
	_ = pool.QueryRow(ctx, `SELECT count(*) FROM interactive.knowledge_chunks`).Scan(&n)
	return n, nil
}

// orTSQuery turns a free-text query into a sanitized OR-of-prefixes tsquery
// (e.g. "what services for gov" -> "servic:* | gov:*"), which gives good recall;
// ts_rank then ranks chunks matching more/rarer terms higher.
func orTSQuery(query string) string {
	var terms []string
	for _, w := range strings.Fields(strings.ToLower(query)) {
		var b strings.Builder
		for _, r := range w {
			if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
				b.WriteRune(r)
			}
		}
		if t := b.String(); len(t) >= 3 {
			terms = append(terms, t+":*")
		}
	}
	return strings.Join(terms, " | ")
}

func retrieveChunks(ctx context.Context, pool *pgxpool.Pool, query string, k int) []ragChunk {
	tsq := orTSQuery(query)
	if tsq == "" {
		return nil
	}
	rows, err := pool.Query(ctx, `
		SELECT source_type, source_slug, title, url, content,
		       ts_rank(tsv, to_tsquery('english', $1)) AS rank
		FROM interactive.knowledge_chunks
		WHERE tsv @@ to_tsquery('english', $1)
		ORDER BY rank DESC LIMIT $2
	`, tsq, k)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []ragChunk
	for rows.Next() {
		var c ragChunk
		if err := rows.Scan(&c.SourceType, &c.Slug, &c.Title, &c.URL, &c.Content, &c.Rank); err == nil {
			out = append(out, c)
		}
	}
	return out
}

func truncateRunes(s string, n int) string {
	s = strings.Join(strings.Fields(s), " ")
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n]) + "…"
}

// ragRespond answers a query using corpus retrieval, falling back to the curated
// knowledge base, then escalation.
func ragRespond(ctx context.Context, pool *pgxpool.Pool, repo domain.ConciergeRepository, query string) domain.ConciergeResponse {
	chunks := retrieveChunks(ctx, pool, query, 4)

	if len(chunks) == 0 {
		// Curated Q&A fallback.
		if entries, err := repo.SearchKnowledgeBase(ctx, query); err == nil && len(entries) > 0 {
			var related []string
			for _, slug := range entries[0].RelatedSlugs {
				related = append(related, "/"+slug)
			}
			return domain.ConciergeResponse{Answer: entries[0].Answer, RelatedPages: related, Confidence: 0.7}
		}
		return domain.ConciergeResponse{
			Answer:     "I don't have a grounded answer for that yet. Would you like me to connect you with the right team member?",
			Confidence: 0, Escalate: true,
		}
	}

	// Deduplicate citations by URL.
	seen := map[string]bool{}
	var citations []string
	var context strings.Builder
	for i, c := range chunks {
		if c.URL != "" && !seen[c.URL] {
			seen[c.URL] = true
			citations = append(citations, c.URL)
		}
		context.WriteString("[" + c.Title + "] " + truncateRunes(c.Content, 700) + "\n\n")
		if i >= 3 {
			break
		}
	}

	confidence := 0.6
	if chunks[0].Rank > 0.08 {
		confidence = 0.9
	} else if chunks[0].Rank > 0.03 {
		confidence = 0.78
	}

	// Generative grounding when an LLM is configured; otherwise extractive.
	if key := os.Getenv("ANTHROPIC_API_KEY"); key != "" {
		if ans := callAnthropicGrounded(ctx, key, query, context.String()); ans != "" {
			return domain.ConciergeResponse{Answer: ans, RelatedPages: citations, Confidence: confidence}
		}
	}

	answer := "Here's what I found in our work: " + truncateRunes(chunks[0].Content, 600)
	if chunks[0].Title != "" {
		answer += "\n\n(From: " + chunks[0].Title + ")"
	}
	return domain.ConciergeResponse{Answer: answer, RelatedPages: citations, Confidence: confidence}
}

// callAnthropicGrounded produces a generative answer strictly grounded in the
// retrieved context. Returns "" on any failure so callers fall back to extractive.
func callAnthropicGrounded(ctx context.Context, apiKey, query, ragContext string) string {
	model := os.Getenv("ANTHROPIC_MODEL")
	if model == "" {
		model = "claude-haiku-4-5-20251001"
	}
	system := "You are the XCreativs concierge. Answer ONLY using the provided context about the firm. " +
		"If the context does not contain the answer, say you don't have that information and offer to connect the user with the team. " +
		"Be concise (2-4 sentences). Never invent capabilities or claims."
	payload := map[string]any{
		"model":      model,
		"max_tokens": 400,
		"system":     system,
		"messages": []map[string]any{
			{"role": "user", "content": "Context:\n" + ragContext + "\nQuestion: " + query},
		},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return ""
	}
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{Timeout: 25 * time.Second}).Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var out struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil || len(out.Content) == 0 {
		return ""
	}
	return strings.TrimSpace(out.Content[0].Text)
}

func handleReindexConcierge(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		n, err := reindexKnowledgeCorpus(r.Context(), pool)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "reindex failed")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"chunks_indexed": n})
	}
}
