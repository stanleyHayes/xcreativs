package db

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// EngagementRepo implements engagement storage.
type EngagementRepo struct {
	pool *pgxpool.Pool
}

// NewEngagementRepo creates a new EngagementRepo.
func NewEngagementRepo(pool *pgxpool.Pool) *EngagementRepo {
	return &EngagementRepo{pool: pool}
}

// --- Engagements ---

func (r *EngagementRepo) CreateEngagement(ctx context.Context, e *domain.Engagement) error {
	whiteLabelJSON, _ := json.Marshal(e.WhiteLabelConfig)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.engagements (id, slug, client_id, client_name, title, description, sector, service_line, stage, start_date, target_end_date, actual_end_date, budget_total_usd, budget_total_ghs, budget_total_eur, currency_preference, is_white_label, white_label_domain, white_label_config, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
	`, e.ID, e.Slug, e.ClientID, e.ClientName, e.Title, e.Description, e.Sector, e.ServiceLine, e.Stage, e.StartDate, e.TargetEndDate, e.ActualEndDate, e.BudgetTotalUSD, e.BudgetTotalGHS, e.BudgetTotalEUR, e.CurrencyPreference, e.IsWhiteLabel, e.WhiteLabelDomain, whiteLabelJSON)
	return err
}

func (r *EngagementRepo) ListEngagementsByUser(ctx context.Context, userID string) ([]domain.Engagement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, client_id, client_name, title, COALESCE(description,'') AS description, sector, service_line, stage, start_date, target_end_date, actual_end_date, budget_total_usd, budget_total_ghs, budget_total_eur, currency_preference, is_white_label, COALESCE(white_label_domain,'') AS white_label_domain, COALESCE(white_label_config,'{}') AS white_label_config, created_at, updated_at
		FROM engagement.engagements
		WHERE client_id = $1 OR id IN (
			SELECT engagement_id FROM engagement.team_members WHERE user_id = $1
		)
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Engagement])
}

func (r *EngagementRepo) ListAllEngagements(ctx context.Context) ([]domain.Engagement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, client_id, client_name, title, COALESCE(description,'') AS description, sector, service_line, stage, start_date, target_end_date, actual_end_date, budget_total_usd, budget_total_ghs, budget_total_eur, currency_preference, is_white_label, COALESCE(white_label_domain,'') AS white_label_domain, COALESCE(white_label_config,'{}') AS white_label_config, created_at, updated_at
		FROM engagement.engagements
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Engagement])
}

func (r *EngagementRepo) GetEngagementByID(ctx context.Context, id string) (*domain.Engagement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, client_id, client_name, title, COALESCE(description,'') AS description, sector, service_line, stage, start_date, target_end_date, actual_end_date, budget_total_usd, budget_total_ghs, budget_total_eur, currency_preference, is_white_label, COALESCE(white_label_domain,'') AS white_label_domain, COALESCE(white_label_config,'{}') AS white_label_config, created_at, updated_at
		FROM engagement.engagements WHERE id = $1 LIMIT 1
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	e, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[domain.Engagement])
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// --- Milestones ---

func (r *EngagementRepo) ListMilestones(ctx context.Context, engagementID string) ([]domain.Milestone, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, title, COALESCE(description,'') AS description, due_date, completed_at, status, sort_order, created_at
		FROM engagement.milestones WHERE engagement_id = $1 ORDER BY sort_order, due_date
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Milestone])
}

func (r *EngagementRepo) CreateMilestone(ctx context.Context, m *domain.Milestone) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.milestones (id, engagement_id, title, description, due_date, completed_at, status, sort_order, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`, m.ID, m.EngagementID, m.Title, m.Description, m.DueDate, m.CompletedAt, m.Status, m.SortOrder)
	return err
}

func (r *EngagementRepo) UpdateMilestone(ctx context.Context, m *domain.Milestone) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.milestones
		SET title = $2, description = $3, due_date = $4, completed_at = $5, status = $6, sort_order = $7
		WHERE id = $1
	`, m.ID, m.Title, m.Description, m.DueDate, m.CompletedAt, m.Status, m.SortOrder)
	return err
}

func (r *EngagementRepo) DeleteMilestone(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.milestones WHERE id = $1`, id)
	return err
}

// --- Deliverables ---

func (r *EngagementRepo) ListDeliverables(ctx context.Context, engagementID string, role string) ([]domain.Deliverable, error) {
	query := `
		SELECT id, engagement_id, title, COALESCE(description,'') AS description, version, COALESCE(file_url,'') AS file_url, COALESCE(file_name,'') AS file_name, file_size_bytes, COALESCE(mime_type,'') AS mime_type, signature_status, signed_at, signed_by, visibility_role, status, created_by, created_at, updated_at
		FROM engagement.deliverables WHERE engagement_id = $1
	`
	args := []any{engagementID}
	if role != "" && role != "admin" {
		query += ` AND (visibility_role = 'viewer'`
		if role == "project" {
			query += ` OR visibility_role = 'project'`
		}
		if role == "executive" {
			query += ` OR visibility_role = 'executive'`
		}
		query += `)`
	}
	query += ` ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Deliverable])
}

func (r *EngagementRepo) CreateDeliverable(ctx context.Context, d *domain.Deliverable) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.deliverables (id, engagement_id, title, description, version, file_url, file_name, file_size_bytes, mime_type, signature_status, visibility_role, status, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
	`, d.ID, d.EngagementID, d.Title, d.Description, d.Version, d.FileURL, d.FileName, d.FileSizeBytes, d.MimeType, d.SignatureStatus, d.VisibilityRole, d.Status, d.CreatedBy)
	return err
}

func (r *EngagementRepo) UpdateDeliverable(ctx context.Context, d *domain.Deliverable) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.deliverables
		SET title = $2, description = $3, version = $4, file_url = $5, file_name = $6, file_size_bytes = $7, mime_type = $8, visibility_role = $9, status = $10, updated_at = NOW()
		WHERE id = $1
	`, d.ID, d.Title, d.Description, d.Version, d.FileURL, d.FileName, d.FileSizeBytes, d.MimeType, d.VisibilityRole, d.Status)
	return err
}

func (r *EngagementRepo) DeleteDeliverable(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.deliverables WHERE id = $1`, id)
	return err
}

// --- Decisions ---

func (r *EngagementRepo) ListDecisions(ctx context.Context, engagementID string) ([]domain.Decision, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, title, COALESCE(description,'') AS description, COALESCE(rationale,'') AS rationale, COALESCE(alternatives_considered,'') AS alternatives_considered, decision_maker, COALESCE(linked_artefacts,'[]') AS linked_artefacts, status, decided_at, created_at, updated_at
		FROM engagement.decisions WHERE engagement_id = $1 ORDER BY created_at DESC
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Decision])
}

func (r *EngagementRepo) CreateDecision(ctx context.Context, d *domain.Decision) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.decisions (id, engagement_id, title, description, rationale, alternatives_considered, decision_maker, linked_artefacts, status, decided_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`, d.ID, d.EngagementID, d.Title, d.Description, d.Rationale, d.AlternativesConsidered, d.DecisionMaker, d.LinkedArtefacts, d.Status, d.DecidedAt)
	return err
}

func (r *EngagementRepo) UpdateDecision(ctx context.Context, d *domain.Decision) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.decisions
		SET title = $2, description = $3, rationale = $4, alternatives_considered = $5, decision_maker = $6, linked_artefacts = $7, status = $8, decided_at = $9, updated_at = NOW()
		WHERE id = $1
	`, d.ID, d.Title, d.Description, d.Rationale, d.AlternativesConsidered, d.DecisionMaker, d.LinkedArtefacts, d.Status, d.DecidedAt)
	return err
}

func (r *EngagementRepo) DeleteDecision(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.decisions WHERE id = $1`, id)
	return err
}

// --- Risks ---

func (r *EngagementRepo) ListRisks(ctx context.Context, engagementID string) ([]domain.Risk, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, title, COALESCE(description,'') AS description, owner, COALESCE(mitigation_plan,'') AS mitigation_plan, COALESCE(residual_rating,'') AS residual_rating, severity, escalation_status, status, linked_decision_id, created_at, updated_at
		FROM engagement.risks WHERE engagement_id = $1 ORDER BY created_at DESC
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Risk])
}

func (r *EngagementRepo) CreateRisk(ctx context.Context, ri *domain.Risk) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.risks (id, engagement_id, title, description, owner, mitigation_plan, residual_rating, severity, escalation_status, status, linked_decision_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
	`, ri.ID, ri.EngagementID, ri.Title, ri.Description, ri.Owner, ri.MitigationPlan, ri.ResidualRating, ri.Severity, ri.EscalationStatus, ri.Status, ri.LinkedDecisionID)
	return err
}

func (r *EngagementRepo) UpdateRisk(ctx context.Context, ri *domain.Risk) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.risks
		SET title = $2, description = $3, owner = $4, mitigation_plan = $5, residual_rating = $6, severity = $7, escalation_status = $8, status = $9, linked_decision_id = $10, updated_at = NOW()
		WHERE id = $1
	`, ri.ID, ri.Title, ri.Description, ri.Owner, ri.MitigationPlan, ri.ResidualRating, ri.Severity, ri.EscalationStatus, ri.Status, ri.LinkedDecisionID)
	return err
}

func (r *EngagementRepo) DeleteRisk(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.risks WHERE id = $1`, id)
	return err
}

// --- Capability Deliveries ---

func (r *EngagementRepo) ListCapabilityDeliveries(ctx context.Context, engagementID string) ([]domain.CapabilityDelivery, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, capability_name, status, COALESCE(reason_deferred,'') AS reason_deferred, delivered_at, sort_order, created_at, updated_at
		FROM engagement.capability_deliveries WHERE engagement_id = $1 ORDER BY sort_order
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.CapabilityDelivery])
}

// --- Budget Lines ---

func (r *EngagementRepo) ListBudgetLines(ctx context.Context, engagementID string) ([]domain.BudgetLine, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, item, allocated_usd, allocated_ghs, allocated_eur, spent_usd, spent_ghs, spent_eur, COALESCE(category,'') AS category, created_at
		FROM engagement.budget_lines WHERE engagement_id = $1 ORDER BY created_at
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.BudgetLine])
}

// --- Invoices ---

func (r *EngagementRepo) ListInvoices(ctx context.Context, engagementID string) ([]domain.Invoice, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, invoice_number, milestone_id, amount, currency, status, COALESCE(stripe_payment_link,'') AS stripe_payment_link, COALESCE(paystack_payment_link,'') AS paystack_payment_link, paid_at, due_date, created_at, updated_at
		FROM engagement.invoices WHERE engagement_id = $1 ORDER BY created_at DESC
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Invoice])
}

// --- Team Members ---

func (r *EngagementRepo) ListTeamMembers(ctx context.Context, engagementID string) ([]domain.TeamMember, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, user_id, name, role, COALESCE(email,'') AS email, availability_status, is_xcreativs, created_at
		FROM engagement.team_members WHERE engagement_id = $1 ORDER BY is_xcreativs DESC, name
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.TeamMember])
}

func (r *EngagementRepo) CreateTeamMember(ctx context.Context, t *domain.TeamMember) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.team_members (id, engagement_id, user_id, name, role, email, availability_status, is_xcreativs, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`, t.ID, t.EngagementID, t.UserID, t.Name, t.Role, t.Email, t.AvailabilityStatus, t.IsXCreativs)
	return err
}

func (r *EngagementRepo) RemoveTeamMember(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.team_members WHERE id = $1`, id)
	return err
}

// --- Support Tickets ---

func (r *EngagementRepo) ListSupportTickets(ctx context.Context, engagementID string) ([]domain.SupportTicket, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, title, COALESCE(description,'') AS description, requester_id, status, priority, sla_target_hours, sla_breached, resolved_at, created_at, updated_at
		FROM engagement.support_tickets WHERE engagement_id = $1 ORDER BY created_at DESC
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.SupportTicket])
}

func (r *EngagementRepo) CreateSupportTicket(ctx context.Context, t *domain.SupportTicket) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.support_tickets (id, engagement_id, title, description, requester_id, status, priority, sla_target_hours, sla_breached, resolved_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`, t.ID, t.EngagementID, t.Title, t.Description, t.RequesterID, t.Status, t.Priority, t.SLATargetHours, t.SLABreached, t.ResolvedAt)
	return err
}

func (r *EngagementRepo) UpdateSupportTicket(ctx context.Context, t *domain.SupportTicket) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.support_tickets
		SET title = $2, description = $3, status = $4, priority = $5, sla_target_hours = $6, sla_breached = $7, resolved_at = $8, updated_at = NOW()
		WHERE id = $1
	`, t.ID, t.Title, t.Description, t.Status, t.Priority, t.SLATargetHours, t.SLABreached, t.ResolvedAt)
	return err
}

func (r *EngagementRepo) DeleteSupportTicket(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM engagement.support_tickets WHERE id = $1`, id)
	return err
}

// --- Activity Feed ---

func (r *EngagementRepo) ListActivityFeed(ctx context.Context, engagementID string, limit int) ([]domain.ActivityFeedItem, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, actor_id, actor_name, action, resource_type, resource_id, COALESCE(metadata,'{}') AS metadata, created_at
		FROM comms.activity_feed WHERE engagement_id = $1 ORDER BY created_at DESC LIMIT $2
	`, engagementID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.ActivityFeedItem])
}

// --- Notifications ---

func (r *EngagementRepo) ListNotifications(ctx context.Context, userID string, limit int) ([]domain.Notification, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, engagement_id, title, COALESCE(body,'') AS body, notification_type, channel, is_read, sent_at, created_at
		FROM comms.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Notification])
}

func (r *EngagementRepo) MarkNotificationRead(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE comms.notifications SET is_read = TRUE WHERE id = $1`, id)
	return err
}

func (r *EngagementRepo) CreateNotification(ctx context.Context, n *domain.Notification) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO comms.notifications (id, user_id, engagement_id, title, body, notification_type, channel, is_read, sent_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, n.ID, n.UserID, n.EngagementID, n.Title, n.Body, n.NotificationType, n.Channel, n.IsRead, n.SentAt)
	return err
}

func (r *EngagementRepo) GetUnreadNotificationCount(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM comms.notifications WHERE user_id = $1 AND is_read = FALSE
	`, userID).Scan(&count)
	return count, err
}

// --- Document Library ---

func (r *EngagementRepo) ListDocumentLibrary(ctx context.Context, engagementID string, role string) ([]domain.DocumentLibraryItem, error) {
	query := `
		SELECT id, engagement_id, title, doc_type, COALESCE(file_url,'') AS file_url, role_scope, created_at
		FROM engagement.document_library WHERE engagement_id = $1
	`
	args := []any{engagementID}
	if role != "" && role != "admin" {
		query += ` AND (role_scope = 'viewer'`
		if role == "project" {
			query += ` OR role_scope = 'project'`
		}
		if role == "executive" {
			query += ` OR role_scope = 'executive'`
		}
		query += `)`
	}
	query += ` ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.DocumentLibraryItem])
}

// --- Reports ---

func (r *EngagementRepo) ListReports(ctx context.Context, engagementID string, role string) ([]domain.Report, error) {
	query := `
		SELECT id, engagement_id, title, report_type, COALESCE(file_url,'') AS file_url, role_scope, created_at
		FROM engagement.reports WHERE engagement_id = $1
	`
	args := []any{engagementID}
	if role != "" && role != "admin" {
		query += ` AND (role_scope = 'viewer'`
		if role == "project" {
			query += ` OR role_scope = 'project'`
		}
		if role == "executive" {
			query += ` OR role_scope = 'executive'`
		}
		query += `)`
	}
	query += ` ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Report])
}

// --- Approval Workflows ---

func (r *EngagementRepo) ListApprovalWorkflows(ctx context.Context, engagementID string) ([]domain.ApprovalWorkflow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, deliverable_id, title, approver_id, status, COALESCE(comments,'') AS comments, COALESCE(rejected_reason,'') AS rejected_reason, requested_at, responded_at
		FROM engagement.approval_workflows WHERE engagement_id = $1 ORDER BY requested_at DESC
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.ApprovalWorkflow])
}

func (r *EngagementRepo) CreateApprovalWorkflow(ctx context.Context, a *domain.ApprovalWorkflow) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO engagement.approval_workflows (id, engagement_id, deliverable_id, title, approver_id, status, comments, rejected_reason, requested_at, responded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NULL)
	`, a.ID, a.EngagementID, a.DeliverableID, a.Title, a.ApproverID, a.Status, a.Comments, a.RejectedReason)
	return err
}

func (r *EngagementRepo) UpdateApprovalWorkflow(ctx context.Context, id string, status, comments, rejectedReason string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE engagement.approval_workflows SET status = $2, comments = $3, rejected_reason = $4, responded_at = NOW() WHERE id = $1
	`, id, status, comments, rejectedReason)
	return err
}

// --- Threads ---

func (r *EngagementRepo) ListThreads(ctx context.Context, engagementID string, parentType string, parentID string) ([]domain.Thread, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, parent_type, parent_id, COALESCE(title,'') AS title, created_by, created_at, updated_at
		FROM comms.threads WHERE engagement_id = $1 AND parent_type = $2 AND parent_id = $3 ORDER BY created_at DESC
	`, engagementID, parentType, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Thread])
}

func (r *EngagementRepo) CreateThread(ctx context.Context, t *domain.Thread) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO comms.threads (id, engagement_id, parent_type, parent_id, title, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
	`, t.ID, t.EngagementID, t.ParentType, t.ParentID, t.Title, t.CreatedBy)
	return err
}

// --- Comments ---

func (r *EngagementRepo) ListComments(ctx context.Context, threadID string) ([]domain.Comment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, thread_id, author_id, author_name, body, created_at
		FROM comms.comments WHERE thread_id = $1 ORDER BY created_at ASC
	`, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Comment])
}

func (r *EngagementRepo) CreateComment(ctx context.Context, c *domain.Comment) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO comms.comments (id, thread_id, author_id, author_name, body, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, c.ID, c.ThreadID, c.AuthorID, c.AuthorName, c.Body)
	return err
}
