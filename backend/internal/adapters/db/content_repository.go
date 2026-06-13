package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// ContentRepo implements domain.ContentRepository using raw PostgreSQL.
type ContentRepo struct {
	pool  *pgxpool.Pool
	cache *Cache
}

// NewContentRepo creates a new ContentRepo.
func NewContentRepo(pool *pgxpool.Pool) *ContentRepo {
	return &ContentRepo{pool: pool, cache: globalCache}
}

func (r *ContentRepo) GetPageBySlug(ctx context.Context, slug string) (*domain.Page, error) {
	cacheKey := CacheKey("page", slug)
	var cached domain.Page
	if r.cache != nil && r.cache.Get(ctx, cacheKey, &cached) {
		return &cached, nil
	}

	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, COALESCE(meta_description,'') AS meta_description, COALESCE(meta_description_fr,'') AS meta_description_fr, data, status, created_at, updated_at
		FROM content.pages WHERE slug = $1 AND status = 'published'
	`, slug)
	p := &domain.Page{}
	var data []byte
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.TitleFR, &p.MetaDescription, &p.MetaDescriptionFR, &data, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(data, &p.Data)
	if r.cache != nil {
		r.cache.Set(ctx, cacheKey, p)
	}
	return p, nil
}

func (r *ContentRepo) GetPageByID(ctx context.Context, id string) (*domain.Page, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, COALESCE(meta_description,'') AS meta_description, COALESCE(meta_description_fr,'') AS meta_description_fr, data, status, created_at, updated_at
		FROM content.pages WHERE id = $1
	`, id)
	p := &domain.Page{}
	var data []byte
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.TitleFR, &p.MetaDescription, &p.MetaDescriptionFR, &data, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(data, &p.Data)
	return p, nil
}

func (r *ContentRepo) ListPages(ctx context.Context, status string) ([]domain.Page, error) {
	query := `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, COALESCE(meta_description,'') AS meta_description, COALESCE(meta_description_fr,'') AS meta_description_fr, data, status, created_at, updated_at
		FROM content.pages
	`
	args := []any{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY updated_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pages []domain.Page
	for rows.Next() {
		var p domain.Page
		var data []byte
		err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.TitleFR, &p.MetaDescription, &p.MetaDescriptionFR, &data, &p.Status, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal(data, &p.Data)
		pages = append(pages, p)
	}
	return pages, nil
}

func (r *ContentRepo) CreatePage(ctx context.Context, p *domain.Page) error {
	data, _ := json.Marshal(p.Data)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content.pages (id, slug, title, title_fr, meta_description, meta_description_fr, data, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
	`, p.ID, p.Slug, p.Title, p.TitleFR, p.MetaDescription, p.MetaDescriptionFR, data, p.Status)
	return err
}

func (r *ContentRepo) UpdatePage(ctx context.Context, p *domain.Page) error {
	data, _ := json.Marshal(p.Data)
	_, err := r.pool.Exec(ctx, `
		UPDATE content.pages
		SET slug = $2, title = $3, title_fr = $4, meta_description = $5, meta_description_fr = $6, data = $7, status = $8, updated_at = NOW()
		WHERE id = $1
	`, p.ID, p.Slug, p.Title, p.TitleFR, p.MetaDescription, p.MetaDescriptionFR, data, p.Status)
	if err != nil {
		return err
	}
	r.InvalidatePageCache(ctx, p.Slug)
	return nil
}

func (r *ContentRepo) DeletePage(ctx context.Context, id string) error {
	// Get slug first for cache invalidation
	var slug string
	_ = r.pool.QueryRow(ctx, `SELECT slug FROM content.pages WHERE id = $1`, id).Scan(&slug)

	_, err := r.pool.Exec(ctx, `DELETE FROM content.pages WHERE id = $1`, id)
	if err != nil {
		return err
	}
	r.InvalidatePageCache(ctx, slug)
	return nil
}

func (r *ContentRepo) InvalidatePageCache(ctx context.Context, slug string) {
	if r.cache != nil && slug != "" {
		r.cache.Delete(ctx, CacheKey("page", slug))
	}
}

func (r *ContentRepo) ListServices(ctx context.Context) ([]domain.Service, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, service_line, title, COALESCE(title_fr,'') AS title_fr, summary, COALESCE(summary_fr,'') AS summary_fr, methodology, deliverables, COALESCE(indicative_timeline,'') AS indicative_timeline, COALESCE(indicative_price_band,'') AS indicative_price_band, faqs, COALESCE(hero_image_url,'') AS hero_image_url, sort_order, status
		FROM content.services WHERE status = 'published' ORDER BY sort_order, title
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Service])
}

func (r *ContentRepo) GetServiceBySlug(ctx context.Context, slug string) (*domain.Service, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, service_line, title, COALESCE(title_fr,'') AS title_fr, summary, COALESCE(summary_fr,'') AS summary_fr, methodology, deliverables, COALESCE(indicative_timeline,'') AS indicative_timeline, COALESCE(indicative_price_band,'') AS indicative_price_band, faqs, COALESCE(hero_image_url,'') AS hero_image_url, sort_order, status
		FROM content.services WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	s, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.Service])
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ContentRepo) ListLabsProducts(ctx context.Context) ([]domain.LabsProduct, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, name, COALESCE(name_fr,'') AS name_fr, tagline, COALESCE(tagline_fr,'') AS tagline_fr, problem_statement, COALESCE(problem_statement_fr,'') AS problem_statement_fr, platform_description, COALESCE(platform_description_fr,'') AS platform_description_fr,
		       COALESCE(technical_architecture_overview,'') AS technical_architecture_overview, sectors, screenshots, request_access_form, sort_order, status
		FROM content.labs_products WHERE status = 'published' ORDER BY sort_order, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.LabsProduct])
}

func (r *ContentRepo) GetLabsProductBySlug(ctx context.Context, slug string) (*domain.LabsProduct, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, name, COALESCE(name_fr,'') AS name_fr, tagline, COALESCE(tagline_fr,'') AS tagline_fr, problem_statement, COALESCE(problem_statement_fr,'') AS problem_statement_fr, platform_description, COALESCE(platform_description_fr,'') AS platform_description_fr,
		       COALESCE(technical_architecture_overview,'') AS technical_architecture_overview, sectors, screenshots, request_access_form, sort_order, status
		FROM content.labs_products WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	p, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.LabsProduct])
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ContentRepo) ListSubsidiaries(ctx context.Context) ([]domain.Subsidiary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, name, COALESCE(name_fr,'') AS name_fr, description, COALESCE(description_fr,'') AS description_fr, status, leadership, COALESCE(relationship_to_parent,'') AS relationship_to_parent, sort_order
		FROM content.subsidiaries ORDER BY sort_order, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Subsidiary])
}

func (r *ContentRepo) ListCaseDossiers(ctx context.Context, filters map[string]string) ([]domain.CaseDossier, error) {
	query := `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, COALESCE(client_name,'') AS client_name, COALESCE(industry::text,'') AS industry, COALESCE(service_line::text,'') AS service_line, COALESCE(scale,'') AS scale, COALESCE(stage,'') AS stage,
		       brief, COALESCE(brief_fr,'') AS brief_fr, COALESCE(constraint_set,'') AS constraint_set, COALESCE(constraint_set_fr,'') AS constraint_set_fr, COALESCE(architecture_chosen,'') AS architecture_chosen, COALESCE(architecture_chosen_fr,'') AS architecture_chosen_fr,
		       what_shipped, COALESCE(what_shipped_fr,'') AS what_shipped_fr, COALESCE(ip_retained,'') AS ip_retained, COALESCE(ip_retained_fr,'') AS ip_retained_fr, COALESCE(learnings,'') AS learnings, COALESCE(learnings_fr,'') AS learnings_fr,
		       anonymized, COALESCE(cover_image_url,'') AS cover_image_url, sort_order, status
		FROM content.case_dossiers WHERE status = 'published'
	`
	args := []any{}
	argIdx := 1
	if industry, ok := filters["industry"]; ok && industry != "" {
		query += fmt.Sprintf(" AND industry = $%d", argIdx)
		args = append(args, industry)
		argIdx++
	}
	if serviceLine, ok := filters["service_line"]; ok && serviceLine != "" {
		query += fmt.Sprintf(" AND service_line = $%d", argIdx)
		args = append(args, serviceLine)
	}
	query += " ORDER BY sort_order, title"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.CaseDossier])
}

func (r *ContentRepo) GetCaseDossierBySlug(ctx context.Context, slug string) (*domain.CaseDossier, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, COALESCE(client_name,'') AS client_name, COALESCE(industry::text,'') AS industry, COALESCE(service_line::text,'') AS service_line, COALESCE(scale,'') AS scale, COALESCE(stage,'') AS stage,
		       brief, COALESCE(brief_fr,'') AS brief_fr, COALESCE(constraint_set,'') AS constraint_set, COALESCE(constraint_set_fr,'') AS constraint_set_fr, COALESCE(architecture_chosen,'') AS architecture_chosen, COALESCE(architecture_chosen_fr,'') AS architecture_chosen_fr,
		       what_shipped, COALESCE(what_shipped_fr,'') AS what_shipped_fr, COALESCE(ip_retained,'') AS ip_retained, COALESCE(ip_retained_fr,'') AS ip_retained_fr, COALESCE(learnings,'') AS learnings, COALESCE(learnings_fr,'') AS learnings_fr,
		       anonymized, COALESCE(cover_image_url,'') AS cover_image_url, sort_order, status
		FROM content.case_dossiers WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	d, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.CaseDossier])
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *ContentRepo) ListIndustries(ctx context.Context) ([]domain.Industry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, sector, title, COALESCE(title_fr,'') AS title_fr, description, COALESCE(description_fr,'') AS description_fr, capability_mapping, relevant_dossier_slugs, COALESCE(intake_cta_text,'') AS intake_cta_text, COALESCE(intake_cta_text_fr,'') AS intake_cta_text_fr, sort_order, status
		FROM content.industries WHERE status = 'published' ORDER BY sort_order, title
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Industry])
}

func (r *ContentRepo) GetIndustryBySlug(ctx context.Context, slug string) (*domain.Industry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, sector, title, COALESCE(title_fr,'') AS title_fr, description, COALESCE(description_fr,'') AS description_fr, capability_mapping, relevant_dossier_slugs, COALESCE(intake_cta_text,'') AS intake_cta_text, COALESCE(intake_cta_text_fr,'') AS intake_cta_text_fr, sort_order, status
		FROM content.industries WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	i, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.Industry])
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *ContentRepo) ListInsights(ctx context.Context, contentType, lang string) ([]domain.Insight, error) {
	query := `
		SELECT id, slug, content_type, title, COALESCE(title_fr,'') AS title_fr, COALESCE(summary,'') AS summary, COALESCE(summary_fr,'') AS summary_fr, body, COALESCE(body_fr,'') AS body_fr, author_name, COALESCE(author_title,'') AS author_title, tags, is_gated, COALESCE(gated_pdf_url,'') AS gated_pdf_url, COALESCE(audio_url,'') AS audio_url, published_at, status
		FROM content.insights WHERE status = 'published' AND published_at IS NOT NULL
	`
	args := []any{}
	argIdx := 1
	if contentType != "" {
		query += fmt.Sprintf(" AND content_type = $%d", argIdx)
		args = append(args, contentType)
	}
	query += " ORDER BY published_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Insight])
}

func (r *ContentRepo) GetInsightBySlug(ctx context.Context, slug string) (*domain.Insight, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, content_type, title, COALESCE(title_fr,'') AS title_fr, COALESCE(summary,'') AS summary, COALESCE(summary_fr,'') AS summary_fr, body, COALESCE(body_fr,'') AS body_fr, author_name, COALESCE(author_title,'') AS author_title, tags, is_gated, COALESCE(gated_pdf_url,'') AS gated_pdf_url, COALESCE(audio_url,'') AS audio_url, published_at, status
		FROM content.insights WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	i, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.Insight])
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *ContentRepo) ListGlossary(ctx context.Context) ([]domain.GlossaryTerm, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, term, COALESCE(term_fr,'') AS term_fr, definition, COALESCE(definition_fr,'') AS definition_fr, related_terms, sort_order
		FROM content.glossary ORDER BY sort_order, term
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.GlossaryTerm])
}

func (r *ContentRepo) ListFAQ(ctx context.Context) ([]domain.FAQ, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, category, COALESCE(category_fr,'') AS category_fr, question, COALESCE(question_fr,'') AS question_fr, answer, COALESCE(answer_fr,'') AS answer_fr, sort_order
		FROM content.faqs ORDER BY category, sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.FAQ])
}

func (r *ContentRepo) ListPressReleases(ctx context.Context) ([]domain.PressRelease, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, body, COALESCE(body_fr,'') AS body_fr, published_at, is_coverage, COALESCE(source_name,'') AS source_name, COALESCE(source_url,'') AS source_url, status
		FROM content.press_releases WHERE status = 'published' ORDER BY published_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.PressRelease])
}

func (r *ContentRepo) ListMediaKit(ctx context.Context) ([]domain.MediaKitAsset, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, asset_type, name, download_url, sort_order
		FROM content.media_kit ORDER BY sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.MediaKitAsset])
}

func (r *ContentRepo) GetLiveTicker(ctx context.Context) (*domain.LiveTicker, error) {
	// For Phase A, compute from engagement schema if present, otherwise return seeded values
	row := r.pool.QueryRow(ctx, `
		SELECT
			COALESCE((SELECT COUNT(*) FROM engagement.engagements WHERE stage = 'active'), 15),
			COALESCE((SELECT COUNT(DISTINCT sector) FROM engagement.engagements WHERE sector IS NOT NULL), 6),
			COALESCE((SELECT COUNT(*) FROM engagement.capability_deliveries WHERE status = 'in_flight'), 23),
			COALESCE((SELECT COUNT(*) FROM engagement.deliverables WHERE status = 'in_progress'), 42)
	`)
	t := &domain.LiveTicker{}
	err := row.Scan(&t.ActiveEngagements, &t.SectorsCovered, &t.CapabilitiesDeployed, &t.TotalDeliverables)
	if err != nil {
		// Return defaults if engagement schema not ready
		return &domain.LiveTicker{
			ActiveEngagements:    15,
			SectorsCovered:       8,
			CapabilitiesDeployed: 23,
			TotalDeliverables:    42,
		}, nil
	}
	return t, nil
}

func (r *ContentRepo) SearchPublic(ctx context.Context, query, lang string) ([]domain.SearchResult, error) {
	// Postgres full-text search across multiple tables
	// Use simple to_tsquery for now; production can use websearch_to_tsquery
	results := []domain.SearchResult{}

	ftsQuery := query + ":*"

	// Search insights
	rows, err := r.pool.Query(ctx, `
		SELECT slug, COALESCE(title_fr, title) as title, LEFT(COALESCE(summary_fr, summary, body_fr, body), 200) as excerpt
		FROM content.insights
		WHERE status = 'published'
		  AND (
		    to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(body,'')) @@ to_tsquery('english', $1)
		    OR to_tsvector('french', COALESCE(title_fr,'') || ' ' || COALESCE(body_fr,'')) @@ to_tsquery('french', $1)
		  )
		LIMIT 10
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "insight"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	// Search case dossiers
	rows, err = r.pool.Query(ctx, `
		SELECT slug, COALESCE(title_fr, title) as title, LEFT(COALESCE(brief_fr, brief), 200) as excerpt
		FROM content.case_dossiers
		WHERE status = 'published'
		  AND (
		    to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(brief,'') || ' ' || COALESCE(what_shipped,'')) @@ to_tsquery('english', $1)
		    OR to_tsvector('french', COALESCE(title_fr,'') || ' ' || COALESCE(brief_fr,'')) @@ to_tsquery('french', $1)
		  )
		LIMIT 10
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "case_dossier"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	// Search services
	rows, err = r.pool.Query(ctx, `
		SELECT slug, COALESCE(title_fr, title) as title, LEFT(COALESCE(summary_fr, summary), 200) as excerpt
		FROM content.services
		WHERE status = 'published'
		  AND (
		    to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(summary,'')) @@ to_tsquery('english', $1)
		    OR to_tsvector('french', COALESCE(title_fr,'') || ' ' || COALESCE(summary_fr,'')) @@ to_tsquery('french', $1)
		  )
		LIMIT 10
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "service"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	return results, nil
}

func (r *ContentRepo) ListReadingListItems(ctx context.Context, category string) ([]domain.ReadingListItem, error) {
	query := `
		SELECT id, slug, title, author, COALESCE(source_publication,'') AS source_publication, COALESCE(source_url,'') AS source_url, COALESCE(published_year, 0) AS published_year,
		       annotation, COALESCE(key_takeaway,'') AS key_takeaway, category, tags, COALESCE(cover_image_url,'') AS cover_image_url, COALESCE(read_time_minutes, 0) AS read_time_minutes, recommended, status, created_at, updated_at
		FROM content.reading_list_items WHERE status = 'published'
	`
	args := []any{}
	if category != "" {
		query += " AND category = $1"
		args = append(args, category)
	}
	query += " ORDER BY recommended DESC, created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.ReadingListItem])
}

func (r *ContentRepo) GetReadingListItemBySlug(ctx context.Context, slug string) (*domain.ReadingListItem, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, author, COALESCE(source_publication,'') AS source_publication, COALESCE(source_url,'') AS source_url, COALESCE(published_year, 0) AS published_year,
		       annotation, COALESCE(key_takeaway,'') AS key_takeaway, category, tags, COALESCE(cover_image_url,'') AS cover_image_url, COALESCE(read_time_minutes, 0) AS read_time_minutes, recommended, status, created_at, updated_at
		FROM content.reading_list_items WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	item, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.ReadingListItem])
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *ContentRepo) ListAudioBriefs(ctx context.Context) ([]domain.AudioBrief, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, summary, duration_seconds, audio_url, COALESCE(transcript,'') AS transcript, speaker_name, COALESCE(speaker_title,'') AS speaker_title,
		       tags, COALESCE(cover_image_url,'') AS cover_image_url, published_at, status, created_at, updated_at
		FROM content.audio_briefs WHERE status = 'published' AND published_at IS NOT NULL
		ORDER BY published_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.AudioBrief])
}

func (r *ContentRepo) GetAudioBriefBySlug(ctx context.Context, slug string) (*domain.AudioBrief, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, summary, duration_seconds, audio_url, COALESCE(transcript,'') AS transcript, speaker_name, COALESCE(speaker_title,'') AS speaker_title,
		       tags, COALESCE(cover_image_url,'') AS cover_image_url, published_at, status, created_at, updated_at
		FROM content.audio_briefs WHERE slug = $1 AND status = 'published'
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ab, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.AudioBrief])
	if err != nil {
		return nil, err
	}
	return &ab, nil
}

func (r *ContentRepo) ListWebinars(ctx context.Context, status string) ([]domain.Webinar, error) {
	query := `
		SELECT id, slug, title, description, scheduled_at, duration_minutes, COALESCE(recording_url,'') AS recording_url, COALESCE(registration_url,'') AS registration_url,
		       COALESCE(max_attendees,0) AS max_attendees, speaker_names, tags, COALESCE(cover_image_url,'') AS cover_image_url, status, created_at, updated_at
		FROM content.webinars
	`
	args := []any{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY scheduled_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Webinar])
}

func (r *ContentRepo) GetWebinarBySlug(ctx context.Context, slug string) (*domain.Webinar, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, scheduled_at, duration_minutes, COALESCE(recording_url,'') AS recording_url, COALESCE(registration_url,'') AS registration_url,
		       COALESCE(max_attendees,0) AS max_attendees, speaker_names, tags, COALESCE(cover_image_url,'') AS cover_image_url, status, created_at, updated_at
		FROM content.webinars WHERE slug = $1
		LIMIT 1
	`, slug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	w, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.Webinar])
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *ContentRepo) RegisterForWebinar(ctx context.Context, reg *domain.WebinarRegistration) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content.webinar_registrations (webinar_id, email, first_name, last_name, organization)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (webinar_id, email) DO NOTHING
	`, reg.WebinarID, reg.Email, reg.FirstName, reg.LastName, reg.Organization)
	return err
}

func (r *ContentRepo) GetWebinarRegistrations(ctx context.Context, webinarID string) ([]domain.WebinarRegistration, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, webinar_id, email, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name, COALESCE(organization,'') AS organization, attended, registered_at
		FROM content.webinar_registrations WHERE webinar_id = $1 ORDER BY registered_at DESC
	`, webinarID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.WebinarRegistration])
}

func (r *ContentRepo) SearchPortal(ctx context.Context, query string, userID string) ([]domain.SearchResult, error) {
	results := []domain.SearchResult{}
	ftsQuery := query + ":*"

	// Search deliverables
	rows, err := r.pool.Query(ctx, `
		SELECT d.id::text, COALESCE(d.title,'') as title, LEFT(COALESCE(d.description,''), 200) as excerpt
		FROM engagement.deliverables d
		JOIN engagement.engagements e ON d.engagement_id = e.id
		WHERE to_tsvector('english', COALESCE(d.title,'') || ' ' || COALESCE(d.description,'')) @@ to_tsquery('english', $1)
		LIMIT 5
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "deliverable"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	// Search decisions
	rows, err = r.pool.Query(ctx, `
		SELECT d.id::text, COALESCE(d.title,'') as title, LEFT(COALESCE(d.description,''), 200) as excerpt
		FROM engagement.decisions d
		WHERE to_tsvector('english', COALESCE(d.title,'') || ' ' || COALESCE(d.description,'')) @@ to_tsquery('english', $1)
		LIMIT 5
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "decision"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	// Search risks
	rows, err = r.pool.Query(ctx, `
		SELECT r.id::text, COALESCE(r.title,'') as title, LEFT(COALESCE(r.description,''), 200) as excerpt
		FROM engagement.risks r
		WHERE to_tsvector('english', COALESCE(r.title,'') || ' ' || COALESCE(r.description,'')) @@ to_tsquery('english', $1)
		LIMIT 5
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "risk"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	// Search comments/threads
	rows, err = r.pool.Query(ctx, `
		SELECT c.id::text, 'Comment' as title, LEFT(c.content, 200) as excerpt
		FROM engagement.comments c
		WHERE to_tsvector('english', c.content) @@ to_tsquery('english', $1)
		LIMIT 5
	`, ftsQuery)
	if err == nil {
		for rows.Next() {
			var sr domain.SearchResult
			sr.Type = "comment"
			_ = rows.Scan(&sr.Slug, &sr.Title, &sr.Excerpt)
			results = append(results, sr)
		}
		rows.Close()
	}

	return results, nil
}
