package db

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// LeadRepo implements domain.LeadRepository.
type LeadRepo struct {
	pool *pgxpool.Pool
}

// NewLeadRepo creates a new LeadRepo.
func NewLeadRepo(pool *pgxpool.Pool) *LeadRepo {
	return &LeadRepo{pool: pool}
}

func (r *LeadRepo) CreateDiagnostic(ctx context.Context, d *domain.Diagnostic) error {
	answersJSON, _ := json.Marshal(d.Answers)
	if len(d.Answers) == 0 {
		answersJSON = []byte("[]")
	}
	// sector is an industry_sector enum column; an empty string is not a valid
	// label, so insert NULL when no sector was provided.
	var sector any
	if d.Sector != "" {
		sector = d.Sector
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.diagnostics (id, email, prospect_name, organization, sector, answers, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
	`, d.ID, d.Email, d.ProspectName, d.Organization, sector, answersJSON, d.Status)
	return err
}

func (r *LeadRepo) GetDiagnostic(ctx context.Context, id string) (*domain.Diagnostic, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(prospect_name, '') AS prospect_name, COALESCE(organization, '') AS organization,
		       COALESCE(sector::text, '') AS sector, answers, COALESCE(routing::text, '') AS routing,
		       COALESCE(summary_pdf_url, '') AS summary_pdf_url, COALESCE(indicative_scope, '') AS indicative_scope,
		       COALESCE(indicative_next_steps, '') AS indicative_next_steps, status, created_at, completed_at
		FROM lead_qual.diagnostics WHERE id = $1
	`, id)
	d := &domain.Diagnostic{}
	var answers []byte
	err := row.Scan(&d.ID, &d.Email, &d.ProspectName, &d.Organization, &d.Sector, &answers, &d.Routing, &d.SummaryPDFURL, &d.IndicativeScope, &d.IndicativeNextSteps, &d.Status, &d.CreatedAt, &d.CompletedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(answers, &d.Answers)
	return d, nil
}

func (r *LeadRepo) UpdateDiagnosticAnswers(ctx context.Context, id string, answers []any, routing string) error {
	answersJSON, _ := json.Marshal(answers)
	if len(answers) == 0 {
		answersJSON = []byte("[]")
	}
	// routing is a diagnostic_routing enum column; insert NULL rather than an
	// empty string (which is not a valid enum label). The diagnostics table has
	// no updated_at column, so do not set one.
	var routingVal any
	if routing != "" {
		routingVal = routing
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.diagnostics SET answers = $1, routing = $2 WHERE id = $3
	`, answersJSON, routingVal, id)
	return err
}

func (r *LeadRepo) CompleteDiagnostic(ctx context.Context, id string, summaryPDF string, scope, nextSteps string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.diagnostics
		SET summary_pdf_url = $1, indicative_scope = $2, indicative_next_steps = $3, status = 'completed', completed_at = NOW()
		WHERE id = $4
	`, summaryPDF, scope, nextSteps, id)
	return err
}

func (r *LeadRepo) ListDiagnosticQuestions(ctx context.Context) ([]domain.DiagnosticQuestion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, question_key, question_text, question_text_fr, question_type, options, branching_rules, sort_order, is_active
		FROM lead_qual.diagnostic_questions WHERE is_active = TRUE ORDER BY sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []domain.DiagnosticQuestion
	for rows.Next() {
		q := domain.DiagnosticQuestion{}
		var opts, rules []byte
		_ = rows.Scan(&q.ID, &q.QuestionKey, &q.QuestionText, &q.QuestionTextFR, &q.QuestionType, &opts, &rules, &q.SortOrder, &q.IsActive)
		_ = json.Unmarshal(opts, &q.Options)
		_ = json.Unmarshal(rules, &q.BranchingRules)
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *LeadRepo) CreateScopeEstimate(ctx context.Context, e *domain.ScopeEstimate) error {
	paramsJSON, _ := json.Marshal(e.Parameters)
	componentsJSON, _ := json.Marshal(e.Components)
	// service_line is an enum column; insert NULL rather than an empty string.
	var serviceLine any
	if e.ServiceLine != "" {
		serviceLine = e.ServiceLine
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.scope_estimates (id, email, prospect_name, organization, service_line, parameters, components, weeks_band, price_band_usd, price_band_ghs, sample_architecture, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
	`, e.ID, e.Email, e.ProspectName, e.Organization, serviceLine, paramsJSON, componentsJSON, e.WeeksBand, e.PriceBandUSD, e.PriceBandGHS, e.SampleArchitecture)
	return err
}

func (r *LeadRepo) CreateRFPSubmission(ctx context.Context, rs *domain.RFPSubmission) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.rfp_submissions (id, organization, contact_name, contact_email, contact_phone, deadline, scope_summary, evaluation_criteria, submission_requirements, document_url, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
	`, rs.ID, rs.Organization, rs.ContactName, rs.ContactEmail, rs.ContactPhone, rs.Deadline, rs.ScopeSummary, rs.EvaluationCriteria, rs.SubmissionRequirements, rs.DocumentURL, rs.Status)
	return err
}

func (r *LeadRepo) ListRFPSubmissions(ctx context.Context, status string) ([]domain.RFPSubmission, error) {
	query := `
		SELECT id, organization, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone, deadline, scope_summary, evaluation_criteria, submission_requirements, document_url, status, assigned_to, sla_acknowledged_at, created_at, updated_at
		FROM lead_qual.rfp_submissions
	`
	args := []any{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rfps []domain.RFPSubmission
	for rows.Next() {
		var r domain.RFPSubmission
		if err := rows.Scan(
			&r.ID, &r.Organization, &r.ContactName, &r.ContactEmail, &r.ContactPhone,
			&r.Deadline, &r.ScopeSummary, &r.EvaluationCriteria, &r.SubmissionRequirements,
			&r.DocumentURL, &r.Status, &r.AssignedTo, &r.SLAAcknowledgedAt,
			&r.CreatedAt, &r.UpdatedAt,
		); err != nil {
			continue
		}
		rfps = append(rfps, r)
	}
	return rfps, rows.Err()
}

func (r *LeadRepo) GetRFPSubmission(ctx context.Context, id string) (*domain.RFPSubmission, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, organization, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone, deadline, scope_summary, evaluation_criteria, submission_requirements, document_url, status, assigned_to, sla_acknowledged_at, created_at, updated_at
		FROM lead_qual.rfp_submissions WHERE id = $1
	`, id)
	var rs domain.RFPSubmission
	err := row.Scan(
		&rs.ID, &rs.Organization, &rs.ContactName, &rs.ContactEmail, &rs.ContactPhone,
		&rs.Deadline, &rs.ScopeSummary, &rs.EvaluationCriteria, &rs.SubmissionRequirements,
		&rs.DocumentURL, &rs.Status, &rs.AssignedTo, &rs.SLAAcknowledgedAt,
		&rs.CreatedAt, &rs.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rs, nil
}

func (r *LeadRepo) UpdateRFPSubmissionStatus(ctx context.Context, id string, status string, assignedTo *uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.rfp_submissions SET status = $1, assigned_to = $2, updated_at = NOW() WHERE id = $3
	`, status, assignedTo, id)
	return err
}

func (r *LeadRepo) CreateNewsletterSubscriber(ctx context.Context, s *domain.NewsletterSubscriber) error {
	segmentsJSON, _ := json.Marshal(s.Segments)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.newsletter_subscribers (id, email, first_name, segments, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET
			segments = EXCLUDED.segments,
			updated_at = NOW()
	`, s.ID, s.Email, s.FirstName, segmentsJSON, s.IsVerified)
	return err
}

func (r *LeadRepo) GetNewsletterSubscriberByEmail(ctx context.Context, email string) (*domain.NewsletterSubscriber, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, COALESCE(first_name,'') AS first_name, segments, is_verified, verified_at, unsubscribed_at, created_at, updated_at
		FROM lead_qual.newsletter_subscribers WHERE email = $1
	`, email)
	s := &domain.NewsletterSubscriber{}
	var segments []byte
	err := row.Scan(&s.ID, &s.Email, &s.FirstName, &segments, &s.IsVerified, &s.VerifiedAt, &s.UnsubscribedAt, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(segments, &s.Segments)
	return s, nil
}

func (r *LeadRepo) CreateConsultationBooking(ctx context.Context, b *domain.ConsultationBooking) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.consultation_bookings (id, email, first_name, last_name, organization, topic, preferred_date, preferred_time, duration_minutes, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
	`, b.ID, b.Email, b.FirstName, b.LastName, b.Organization, b.Topic, b.PreferredDate, b.PreferredTime, b.DurationMinutes, b.Status, b.Notes)
	return err
}

func (r *LeadRepo) ListConsultationBookings(ctx context.Context, status string) ([]domain.ConsultationBooking, error) {
	query := `
		SELECT id, email, COALESCE(first_name,'') AS first_name, COALESCE(last_name,'') AS last_name, COALESCE(organization,'') AS organization,
		       topic, preferred_date, COALESCE(preferred_time,'') AS preferred_time, duration_minutes, status, scheduled_at,
		       COALESCE(notes,'') AS notes, created_at, updated_at
		FROM lead_qual.consultation_bookings
	`
	args := []any{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.ConsultationBooking])
}

func (r *LeadRepo) UpdateConsultationBookingStatus(ctx context.Context, id string, status string, scheduledAt *time.Time, notes string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.consultation_bookings SET status = $1, scheduled_at = $2, notes = $3, updated_at = NOW() WHERE id = $4
	`, status, scheduledAt, notes, id)
	return err
}
