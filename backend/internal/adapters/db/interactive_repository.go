package db

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// InteractiveRepo implements domain.ConciergeRepository.
type InteractiveRepo struct {
	pool *pgxpool.Pool
}

// NewInteractiveRepo creates a new InteractiveRepo.
func NewInteractiveRepo(pool *pgxpool.Pool) *InteractiveRepo {
	return &InteractiveRepo{pool: pool}
}

func (r *InteractiveRepo) CreateChatSession(ctx context.Context, s *domain.ChatSession) (*domain.ChatSession, error) {
	row, err := r.pool.Query(ctx, `
		INSERT INTO interactive.chat_sessions (user_id, visitor_id, source, status, subject)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, visitor_id, source, status, subject, escalated_to, escalated_at, closed_at, created_at, updated_at
	`, s.UserID, s.VisitorID, s.Source, s.Status, s.Subject)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	sessions, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.ChatSession])
	if err != nil || len(sessions) == 0 {
		return nil, err
	}
	return &sessions[0], nil
}

func (r *InteractiveRepo) GetChatSession(ctx context.Context, id string) (*domain.ChatSession, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, user_id, visitor_id, source, status, subject, escalated_to, escalated_at, closed_at, created_at, updated_at
		FROM interactive.chat_sessions WHERE id = $1
	`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	sessions, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.ChatSession])
	if err != nil || len(sessions) == 0 {
		return nil, err
	}
	return &sessions[0], nil
}

func (r *InteractiveRepo) ListChatSessions(ctx context.Context, userID string, visitorID string, limit int) ([]domain.ChatSession, error) {
	query := `
		SELECT id, user_id, visitor_id, source, status, subject, escalated_to, escalated_at, closed_at, created_at, updated_at
		FROM interactive.chat_sessions
		WHERE ($1 = '' OR user_id::text = $1) AND ($2 = '' OR visitor_id = $2)
		ORDER BY updated_at DESC
	`
	args := []any{userID, visitorID}
	if limit > 0 {
		query += " LIMIT $3"
		args = append(args, limit)
	}
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.ChatSession])
}

func (r *InteractiveRepo) UpdateChatSessionStatus(ctx context.Context, id string, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE interactive.chat_sessions SET status = $1, updated_at = NOW() WHERE id = $2`, status, id)
	return err
}

func (r *InteractiveRepo) CloseChatSession(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE interactive.chat_sessions SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *InteractiveRepo) CreateChatMessage(ctx context.Context, m *domain.ChatMessage) error {
	metadata, _ := json.Marshal(m.Metadata)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO interactive.chat_messages (session_id, sender_type, content, metadata)
		VALUES ($1, $2, $3, $4)
	`, m.SessionID, m.Role, m.Content, metadata)
	return err
}

func (r *InteractiveRepo) ListChatMessages(ctx context.Context, sessionID string, limit int) ([]domain.ChatMessage, error) {
	query := `
		SELECT id, session_id, sender_type::text AS role, content, COALESCE(metadata,'{}') AS metadata, created_at
		FROM interactive.chat_messages
		WHERE session_id = $1
		ORDER BY created_at ASC
	`
	args := []any{sessionID}
	if limit > 0 {
		query += " LIMIT $2"
		args = append(args, limit)
	}
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []domain.ChatMessage
	for rows.Next() {
		var m domain.ChatMessage
		var meta []byte
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &meta, &m.CreatedAt); err != nil {
			continue
		}
		_ = json.Unmarshal(meta, &m.Metadata)
		if m.Metadata == nil {
			m.Metadata = map[string]any{}
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

var stopWords = map[string]bool{
	"what": true, "is": true, "are": true, "do": true, "does": true, "did": true,
	"you": true, "your": true, "the": true, "a": true, "an": true, "and": true,
	"or": true, "to": true, "of": true, "in": true, "on": true, "at": true,
	"for": true, "with": true, "about": true, "how": true, "can": true, "i": true,
	"me": true, "my": true, "we": true, "us": true, "our": true, "it": true,
	"its": true, "that": true, "this": true, "these": true, "those": true,
	"have": true, "has": true, "had": true, "be": true, "been": true, "being": true,
	"was": true, "were": true, "will": true, "would": true, "could": true, "should": true,
}

func cleanKeyword(kw string) string {
	// Strip punctuation
	var b strings.Builder
	for _, r := range kw {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func (r *InteractiveRepo) SearchKnowledgeBase(ctx context.Context, query string) ([]domain.KnowledgeBaseEntry, error) {
	// Extract meaningful keywords
	keywords := strings.Fields(strings.ToLower(query))
	var meaningful []string
	for _, kw := range keywords {
		cleaned := cleanKeyword(kw)
		if cleaned != "" && !stopWords[cleaned] && len(cleaned) > 2 {
			meaningful = append(meaningful, cleaned)
		}
	}
	if len(meaningful) == 0 {
		// Fall back to using longer words from original query
		for _, kw := range keywords {
			cleaned := cleanKeyword(kw)
			if len(cleaned) > 3 {
				meaningful = append(meaningful, cleaned)
			}
		}
	}
	if len(meaningful) == 0 {
		return r.ListKnowledgeBase(ctx, "")
	}

	var args []any
	var parts []string
	for _, kw := range meaningful {
		args = append(args, "%"+kw+"%")
		idx := len(args)
		parts = append(parts, `LOWER(question) LIKE $`+strconv.Itoa(idx)+` OR LOWER(answer) LIKE $`+strconv.Itoa(idx))
	}
	q := `SELECT id, category, question AS question_pattern, answer, keywords AS related_slugs, 0 AS priority, TRUE AS is_active, created_at, updated_at
		FROM interactive.knowledge_base
		WHERE (` + strings.Join(parts, " OR ") + `)
		ORDER BY created_at DESC LIMIT 5`

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.KnowledgeBaseEntry])
}

func (r *InteractiveRepo) ListKnowledgeBase(ctx context.Context, category string) ([]domain.KnowledgeBaseEntry, error) {
	query := `SELECT id, category, question AS question_pattern, answer, keywords AS related_slugs, 0 AS priority, TRUE AS is_active, created_at, updated_at
		FROM interactive.knowledge_base WHERE TRUE`
	args := []any{}
	if category != "" {
		query += " AND category = $1"
		args = append(args, category)
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.KnowledgeBaseEntry])
}


// --- AssessmentRepository methods ---

func (r *InteractiveRepo) GetAssessmentTemplateBySlug(ctx context.Context, slug string) (*domain.AssessmentTemplate, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, version, is_active, created_at
		FROM interactive.assessment_templates WHERE slug = $1 AND is_active = TRUE
	`, slug)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	templates, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.AssessmentTemplate])
	if err != nil || len(templates) == 0 {
		return nil, err
	}
	return &templates[0], nil
}

func (r *InteractiveRepo) ListAssessmentQuestions(ctx context.Context, templateID string) ([]domain.AssessmentQuestion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, template_id, question_text, dimension, question_order, options, created_at
		FROM interactive.assessment_questions
		WHERE template_id = $1
		ORDER BY question_order
	`, templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []domain.AssessmentQuestion
	for rows.Next() {
		var q domain.AssessmentQuestion
		var opts []byte
		if err := rows.Scan(&q.ID, &q.TemplateID, &q.QuestionText, &q.Dimension, &q.QuestionOrder, &opts, &q.CreatedAt); err != nil {
			continue
		}
		_ = json.Unmarshal(opts, &q.Options)
		questions = append(questions, q)
	}
	return questions, rows.Err()
}

func (r *InteractiveRepo) CreateAssessmentSession(ctx context.Context, s *domain.AssessmentSession) error {
	answers, _ := json.Marshal(s.Answers)
	scores, _ := json.Marshal(s.Scores)
	return r.pool.QueryRow(ctx, `
		INSERT INTO interactive.assessment_sessions (id, template_id, email, organization, status, answers, scores, overall_score, recommendation_summary)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at
	`, s.ID, s.TemplateID, s.Email, s.Organization, s.Status, answers, scores, s.OverallScore, s.RecommendationSummary).Scan(&s.CreatedAt)
}

func (r *InteractiveRepo) GetAssessmentSession(ctx context.Context, id string) (*domain.AssessmentSession, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, template_id, email, organization, status, answers, scores, overall_score, recommendation_summary, created_at, completed_at
		FROM interactive.assessment_sessions WHERE id = $1
	`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()

	var sessions []domain.AssessmentSession
	for row.Next() {
		var s domain.AssessmentSession
		var answers, scores []byte
		if err := row.Scan(&s.ID, &s.TemplateID, &s.Email, &s.Organization, &s.Status, &answers, &scores, &s.OverallScore, &s.RecommendationSummary, &s.CreatedAt, &s.CompletedAt); err != nil {
			continue
		}
		_ = json.Unmarshal(answers, &s.Answers)
		_ = json.Unmarshal(scores, &s.Scores)
		sessions = append(sessions, s)
	}
	if len(sessions) == 0 {
		return nil, row.Err()
	}
	return &sessions[0], row.Err()
}

func (r *InteractiveRepo) UpdateAssessmentSession(ctx context.Context, s *domain.AssessmentSession) error {
	answers, _ := json.Marshal(s.Answers)
	scores, _ := json.Marshal(s.Scores)
	var completedAt interface{}
	if s.CompletedAt != nil {
		completedAt = *s.CompletedAt
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE interactive.assessment_sessions
		SET status = $1, answers = $2, scores = $3, overall_score = $4, recommendation_summary = $5, completed_at = $6
		WHERE id = $7
	`, s.Status, answers, scores, s.OverallScore, s.RecommendationSummary, completedAt, s.ID)
	return err
}
