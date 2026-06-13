package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

func handlePortalHome(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		engagements, err := deps.Engagement.ListEngagementsByUser(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list engagements")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"user_id":     userID,
			"engagements": engagements,
		})
	}
}

func handleListEngagements(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		engagements, err := deps.Engagement.ListEngagementsByUser(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list engagements")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagements": engagements})
	}
}

func handleGetEngagement(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		eng, err := deps.Engagement.GetEngagementByID(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "engagement not found")
			return
		}
		respondJSON(w, http.StatusOK, eng)
	}
}

func handleEngagementDashboard(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		eng, err := deps.Engagement.GetEngagementByID(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "engagement not found")
			return
		}
		milestones, _ := deps.Engagement.ListMilestones(r.Context(), id)
		activity, _ := deps.Engagement.ListActivityFeed(r.Context(), id, 10)
		respondJSON(w, http.StatusOK, map[string]any{
			"engagement":      eng,
			"milestones":      milestones,
			"recent_activity": activity,
		})
	}
}

func handleListMilestones(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		milestones, err := deps.Engagement.ListMilestones(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list milestones")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"milestones": milestones})
	}
}

func handleCreateMilestone(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			DueDate     string `json:"due_date"`
			Status      string `json:"status"`
			SortOrder   int    `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "upcoming", "in_progress", "completed")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		var dueDate *time.Time
		if req.DueDate != "" {
			if d, err := time.Parse("2006-01-02", req.DueDate); err == nil {
				dueDate = &d
			}
		}
		eid, _ := uuid.Parse(id)
		m := &domain.Milestone{
			ID:           uuid.New(),
			EngagementID: eid,
			Title:        req.Title,
			Description:  req.Description,
			DueDate:      dueDate,
			Status:       req.Status,
			SortOrder:    req.SortOrder,
		}
		if err := deps.Engagement.CreateMilestone(r.Context(), m); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create milestone")
			return
		}
		respondJSON(w, http.StatusCreated, m)
	}
}

func handleUpdateMilestone(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		milestoneID := chi.URLParam(r, "milestoneID")
		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			DueDate     string `json:"due_date"`
			Status      string `json:"status"`
			SortOrder   int    `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "upcoming", "in_progress", "completed")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		var dueDate, completedAt *time.Time
		if req.DueDate != "" {
			if d, err := time.Parse("2006-01-02", req.DueDate); err == nil {
				dueDate = &d
			}
		}
		if req.Status == "completed" {
			now := time.Now()
			completedAt = &now
		}
		mid, _ := uuid.Parse(milestoneID)
		m := &domain.Milestone{
			ID:          mid,
			Title:       req.Title,
			Description: req.Description,
			DueDate:     dueDate,
			CompletedAt: completedAt,
			Status:      req.Status,
			SortOrder:   req.SortOrder,
		}
		if err := deps.Engagement.UpdateMilestone(r.Context(), m); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update milestone")
			return
		}
		respondJSON(w, http.StatusOK, m)
	}
}

func handleDeleteMilestone(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		milestoneID := chi.URLParam(r, "milestoneID")
		if err := deps.Engagement.DeleteMilestone(r.Context(), milestoneID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete milestone")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleListDeliverables(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		role, _ := r.Context().Value(userRoleKey).(string)
		deliverables, err := deps.Engagement.ListDeliverables(r.Context(), id, role)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list deliverables")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "deliverables": deliverables})
	}
}

func handleCreateDeliverable(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Title          string `json:"title"`
			Description    string `json:"description"`
			Version        int    `json:"version"`
			FileURL        string `json:"file_url"`
			FileName       string `json:"file_name"`
			FileSizeBytes  *int64 `json:"file_size_bytes"`
			MimeType       string `json:"mime_type"`
			VisibilityRole string `json:"visibility_role"`
			Status         string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "draft", "review", "approved", "delivered", "archived")
		v.In("visibility_role", req.VisibilityRole, "viewer", "project", "executive")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		uid, _ := r.Context().Value(userIDKey).(string)
		uidUUID, _ := uuid.Parse(uid)
		eid, _ := uuid.Parse(id)
		d := &domain.Deliverable{
			ID:              uuid.New(),
			EngagementID:    eid,
			Title:           req.Title,
			Description:     req.Description,
			Version:         req.Version,
			FileURL:         req.FileURL,
			FileName:        req.FileName,
			FileSizeBytes:   req.FileSizeBytes,
			MimeType:        req.MimeType,
			SignatureStatus: "unsigned",
			VisibilityRole:  req.VisibilityRole,
			Status:          req.Status,
			CreatedBy:       &uidUUID,
		}
		if err := deps.Engagement.CreateDeliverable(r.Context(), d); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create deliverable")
			return
		}
		respondJSON(w, http.StatusCreated, d)
	}
}

func handleUpdateDeliverable(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		did := chi.URLParam(r, "deliverableID")
		var req struct {
			Title          string `json:"title"`
			Description    string `json:"description"`
			Version        int    `json:"version"`
			FileURL        string `json:"file_url"`
			FileName       string `json:"file_name"`
			FileSizeBytes  *int64 `json:"file_size_bytes"`
			MimeType       string `json:"mime_type"`
			VisibilityRole string `json:"visibility_role"`
			Status         string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "draft", "review", "approved", "delivered", "archived")
		v.In("visibility_role", req.VisibilityRole, "viewer", "project", "executive")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		id, _ := uuid.Parse(did)
		d := &domain.Deliverable{
			ID:             id,
			Title:          req.Title,
			Description:    req.Description,
			Version:        req.Version,
			FileURL:        req.FileURL,
			FileName:       req.FileName,
			FileSizeBytes:  req.FileSizeBytes,
			MimeType:       req.MimeType,
			VisibilityRole: req.VisibilityRole,
			Status:         req.Status,
		}
		if err := deps.Engagement.UpdateDeliverable(r.Context(), d); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update deliverable")
			return
		}
		respondJSON(w, http.StatusOK, d)
	}
}

func handleDeleteDeliverable(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		did := chi.URLParam(r, "deliverableID")
		if err := deps.Engagement.DeleteDeliverable(r.Context(), did); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete deliverable")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleListDecisions(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		decisions, err := deps.Engagement.ListDecisions(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list decisions")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "decisions": decisions})
	}
}

func handleCreateDecision(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Title                  string `json:"title"`
			Description            string `json:"description"`
			Rationale              string `json:"rationale"`
			AlternativesConsidered string `json:"alternatives_considered"`
			Status                 string `json:"status"`
			LinkedArtefacts        []any  `json:"linked_artefacts"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "proposed", "approved", "rejected", "superseded")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		eid, _ := uuid.Parse(id)
		d := &domain.Decision{
			ID:                     uuid.New(),
			EngagementID:           eid,
			Title:                  req.Title,
			Description:            req.Description,
			Rationale:              req.Rationale,
			AlternativesConsidered: req.AlternativesConsidered,
			Status:                 req.Status,
			LinkedArtefacts:        req.LinkedArtefacts,
		}
		if req.Status == "approved" || req.Status == "rejected" {
			now := time.Now()
			d.DecidedAt = &now
		}
		if err := deps.Engagement.CreateDecision(r.Context(), d); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create decision")
			return
		}
		respondJSON(w, http.StatusCreated, d)
	}
}

func handleUpdateDecision(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		did := chi.URLParam(r, "decisionID")
		var req struct {
			Title                  string `json:"title"`
			Description            string `json:"description"`
			Rationale              string `json:"rationale"`
			AlternativesConsidered string `json:"alternatives_considered"`
			Status                 string `json:"status"`
			LinkedArtefacts        []any  `json:"linked_artefacts"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "proposed", "approved", "rejected", "superseded")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		id, _ := uuid.Parse(did)
		d := &domain.Decision{
			ID:                     id,
			Title:                  req.Title,
			Description:            req.Description,
			Rationale:              req.Rationale,
			AlternativesConsidered: req.AlternativesConsidered,
			Status:                 req.Status,
			LinkedArtefacts:        req.LinkedArtefacts,
		}
		if req.Status == "approved" || req.Status == "rejected" {
			now := time.Now()
			d.DecidedAt = &now
		}
		if err := deps.Engagement.UpdateDecision(r.Context(), d); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update decision")
			return
		}
		respondJSON(w, http.StatusOK, d)
	}
}

func handleDeleteDecision(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		did := chi.URLParam(r, "decisionID")
		if err := deps.Engagement.DeleteDecision(r.Context(), did); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete decision")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleListRisks(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		risks, err := deps.Engagement.ListRisks(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list risks")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "risks": risks})
	}
}

func handleCreateRisk(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Title            string     `json:"title"`
			Description      string     `json:"description"`
			MitigationPlan   string     `json:"mitigation_plan"`
			ResidualRating   string     `json:"residual_rating"`
			Severity         string     `json:"severity"`
			EscalationStatus string     `json:"escalation_status"`
			Status           string     `json:"status"`
			LinkedDecisionID *uuid.UUID `json:"linked_decision_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("severity", req.Severity, "low", "medium", "high", "critical")
		v.In("escalation_status", req.EscalationStatus, "none", "watch", "escalated", "resolved")
		v.In("status", req.Status, "open", "mitigated", "accepted", "closed")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		eid, _ := uuid.Parse(id)
		ri := &domain.Risk{
			ID:               uuid.New(),
			EngagementID:     eid,
			Title:            req.Title,
			Description:      req.Description,
			MitigationPlan:   req.MitigationPlan,
			ResidualRating:   req.ResidualRating,
			Severity:         req.Severity,
			EscalationStatus: req.EscalationStatus,
			Status:           req.Status,
			LinkedDecisionID: req.LinkedDecisionID,
		}
		if err := deps.Engagement.CreateRisk(r.Context(), ri); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create risk")
			return
		}
		respondJSON(w, http.StatusCreated, ri)
	}
}

func handleUpdateRisk(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		rid := chi.URLParam(r, "riskID")
		var req struct {
			Title            string     `json:"title"`
			Description      string     `json:"description"`
			MitigationPlan   string     `json:"mitigation_plan"`
			ResidualRating   string     `json:"residual_rating"`
			Severity         string     `json:"severity"`
			EscalationStatus string     `json:"escalation_status"`
			Status           string     `json:"status"`
			LinkedDecisionID *uuid.UUID `json:"linked_decision_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("severity", req.Severity, "low", "medium", "high", "critical")
		v.In("escalation_status", req.EscalationStatus, "none", "watch", "escalated", "resolved")
		v.In("status", req.Status, "open", "mitigated", "accepted", "closed")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		id, _ := uuid.Parse(rid)
		ri := &domain.Risk{
			ID:               id,
			Title:            req.Title,
			Description:      req.Description,
			MitigationPlan:   req.MitigationPlan,
			ResidualRating:   req.ResidualRating,
			Severity:         req.Severity,
			EscalationStatus: req.EscalationStatus,
			Status:           req.Status,
			LinkedDecisionID: req.LinkedDecisionID,
		}
		if err := deps.Engagement.UpdateRisk(r.Context(), ri); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update risk")
			return
		}
		respondJSON(w, http.StatusOK, ri)
	}
}

func handleDeleteRisk(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		rid := chi.URLParam(r, "riskID")
		if err := deps.Engagement.DeleteRisk(r.Context(), rid); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete risk")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleActivityFeed(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		activity, err := deps.Engagement.ListActivityFeed(r.Context(), id, 50)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list activity")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "activities": activity})
	}
}

func handleListTeamMembers(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		members, err := deps.Engagement.ListTeamMembers(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list team members")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "team_members": members})
	}
}

func handleCreateTeamMember(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Name               string `json:"name"`
			Role               string `json:"role"`
			Email              string `json:"email"`
			AvailabilityStatus string `json:"availability_status"`
			IsXCreativs        bool   `json:"is_xcreativs"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("name", req.Name, "name is required")
		v.Required("role", req.Role, "role is required")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		eid, _ := uuid.Parse(id)
		member := &domain.TeamMember{
			ID:                 uuid.New(),
			EngagementID:       eid,
			Name:               req.Name,
			Role:               req.Role,
			Email:              req.Email,
			AvailabilityStatus: req.AvailabilityStatus,
			IsXCreativs:        req.IsXCreativs,
		}
		if err := deps.Engagement.CreateTeamMember(r.Context(), member); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to add team member")
			return
		}
		respondJSON(w, http.StatusCreated, member)
	}
}

func handleRemoveTeamMember(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		memberID := chi.URLParam(r, "memberID")
		if err := deps.Engagement.RemoveTeamMember(r.Context(), memberID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to remove team member")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleListSupportTickets(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		tickets, err := deps.Engagement.ListSupportTickets(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list support tickets")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "tickets": tickets})
	}
}

func handleCreateSupportTicket(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Title          string `json:"title"`
			Description    string `json:"description"`
			Priority       string `json:"priority"`
			SLATargetHours int    `json:"sla_target_hours"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("priority", req.Priority, "low", "medium", "high")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		uid, _ := r.Context().Value(userIDKey).(string)
		uidUUID, _ := uuid.Parse(uid)
		eid, _ := uuid.Parse(id)
		t := &domain.SupportTicket{
			ID:             uuid.New(),
			EngagementID:   eid,
			Title:          req.Title,
			Description:    req.Description,
			RequesterID:    &uidUUID,
			Status:         "open",
			Priority:       req.Priority,
			SLATargetHours: &req.SLATargetHours,
		}
		if err := deps.Engagement.CreateSupportTicket(r.Context(), t); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create ticket")
			return
		}
		respondJSON(w, http.StatusCreated, t)
	}
}

func handleUpdateSupportTicket(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		tid := chi.URLParam(r, "ticketID")
		var req struct {
			Title          string     `json:"title"`
			Description    string     `json:"description"`
			Status         string     `json:"status"`
			Priority       string     `json:"priority"`
			SLATargetHours int        `json:"sla_target_hours"`
			ResolvedAt     *time.Time `json:"resolved_at"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.In("status", req.Status, "open", "in_progress", "resolved", "closed")
		v.In("priority", req.Priority, "low", "medium", "high")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		id, _ := uuid.Parse(tid)
		var resolvedAt *time.Time
		if req.Status == "resolved" || req.Status == "closed" {
			now := time.Now()
			resolvedAt = &now
		}
		t := &domain.SupportTicket{
			ID:             id,
			Title:          req.Title,
			Description:    req.Description,
			Status:         req.Status,
			Priority:       req.Priority,
			SLATargetHours: &req.SLATargetHours,
			ResolvedAt:     resolvedAt,
		}
		if err := deps.Engagement.UpdateSupportTicket(r.Context(), t); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update ticket")
			return
		}
		respondJSON(w, http.StatusOK, t)
	}
}

func handleDeleteSupportTicket(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		tid := chi.URLParam(r, "ticketID")
		if err := deps.Engagement.DeleteSupportTicket(r.Context(), tid); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete ticket")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}

func handleListBudgetLines(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		lines, err := deps.Engagement.ListBudgetLines(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list budget lines")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "budget_lines": lines})
	}
}

func handleListInvoices(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		invoices, err := deps.Engagement.ListInvoices(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list invoices")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "invoices": invoices})
	}
}

func handleListCapabilityDeliveries(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		deliveries, err := deps.Engagement.ListCapabilityDeliveries(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list capability deliveries")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "capability_deliveries": deliveries})
	}
}

func handleListNotifications(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		notifications, err := deps.Engagement.ListNotifications(r.Context(), userID, 50)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list notifications")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"notifications": notifications})
	}
}

func handleMarkNotificationRead(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if err := deps.Engagement.MarkNotificationRead(r.Context(), id); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to mark notification read")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func handleGetUnreadNotificationCount(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		count, err := deps.Engagement.GetUnreadNotificationCount(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to get count")
			return
		}
		respondJSON(w, http.StatusOK, map[string]int{"unread_count": count})
	}
}

func handleListThreads(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		engagementID := chi.URLParam(r, "id")
		parentType := r.URL.Query().Get("parent_type")
		parentID := r.URL.Query().Get("parent_id")
		threads, err := deps.Engagement.ListThreads(r.Context(), engagementID, parentType, parentID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list threads")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"threads": threads})
	}
}

func handleCreateThread(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			EngagementID string `json:"engagement_id"`
			ParentType   string `json:"parent_type"`
			ParentID     string `json:"parent_id"`
			Title        string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		v := NewValidator()
		v.Required("title", req.Title, "title is required")
		v.MaxLength("title", req.Title, 200)
		v.MaxLength("parent_type", req.ParentType, 50)
		if !v.Valid() {
			respondError(w, http.StatusBadRequest, v.Errors["title"])
			return
		}
		userID := r.Context().Value(userIDKey).(string)
		uid, _ := uuid.Parse(userID)
		engagementID, err := uuid.Parse(req.EngagementID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement_id")
			return
		}
		parentID, err := uuid.Parse(req.ParentID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid parent_id")
			return
		}
		t := &domain.Thread{
			ID:           uuid.New(),
			EngagementID: engagementID,
			ParentType:   req.ParentType,
			ParentID:     parentID,
			Title:        req.Title,
			CreatedBy:    &uid,
		}
		if err := deps.Engagement.CreateThread(r.Context(), t); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create thread")
			return
		}
		respondJSON(w, http.StatusCreated, t)
	}
}

func handleListComments(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		threadID := chi.URLParam(r, "thread_id")
		comments, err := deps.Engagement.ListComments(r.Context(), threadID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list comments")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"comments": comments})
	}
}

func handleCreateComment(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ThreadID   string `json:"thread_id"`
			Body       string `json:"body"`
			AuthorName string `json:"author_name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		v := NewValidator()
		v.Required("body", req.Body, "body is required")
		v.MaxLength("body", req.Body, 10000)
		v.MaxLength("author_name", req.AuthorName, 100)
		if !v.Valid() {
			respondError(w, http.StatusBadRequest, v.Errors["body"])
			return
		}
		userID := r.Context().Value(userIDKey).(string)
		uid, _ := uuid.Parse(userID)
		threadID, err := uuid.Parse(req.ThreadID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid thread_id")
			return
		}
		c := &domain.Comment{
			ID:         uuid.New(),
			ThreadID:   threadID,
			AuthorID:   &uid,
			AuthorName: req.AuthorName,
			Body:       req.Body,
		}
		if err := deps.Engagement.CreateComment(r.Context(), c); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create comment")
			return
		}
		respondJSON(w, http.StatusCreated, c)
	}
}

func handleListDocumentLibrary(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		role, _ := r.Context().Value(userRoleKey).(string)
		items, err := deps.Engagement.ListDocumentLibrary(r.Context(), id, role)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list document library")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "documents": items})
	}
}

func handleListReports(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		role, _ := r.Context().Value(userRoleKey).(string)
		reports, err := deps.Engagement.ListReports(r.Context(), id, role)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list reports")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "reports": reports})
	}
}

func handleListApprovalWorkflows(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		workflows, err := deps.Engagement.ListApprovalWorkflows(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list approval workflows")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "workflows": workflows})
	}
}

func handleCreateApprovalWorkflow(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			EngagementID  string `json:"engagement_id"`
			DeliverableID string `json:"deliverable_id"`
			Title         string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		engagementID, err := uuid.Parse(req.EngagementID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement_id")
			return
		}
		deliverableID, err := parseOptionalUUID(req.DeliverableID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid deliverable_id")
			return
		}
		a := &domain.ApprovalWorkflow{
			ID:            uuid.New(),
			EngagementID:  engagementID,
			DeliverableID: deliverableID,
			Title:         req.Title,
			Status:        "pending",
		}
		if err := deps.Engagement.CreateApprovalWorkflow(r.Context(), a); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create approval workflow")
			return
		}
		respondJSON(w, http.StatusCreated, a)
	}
}

func handleUpdateApprovalWorkflow(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Status         string `json:"status"`
			Comments       string `json:"comments"`
			RejectedReason string `json:"rejected_reason"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		v := NewValidator()
		v.In("status", req.Status, "pending", "approved", "rejected")
		v.MaxLength("comments", req.Comments, 5000)
		v.MaxLength("rejected_reason", req.RejectedReason, 2000)
		if !v.Valid() {
			respondError(w, http.StatusBadRequest, v.Errors["status"])
			return
		}
		if err := deps.Engagement.UpdateApprovalWorkflow(r.Context(), id, req.Status, req.Comments, req.RejectedReason); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update approval workflow")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func parseOptionalUUID(s string) (*uuid.UUID, error) {
	if s == "" {
		return nil, nil
	}
	u, err := uuid.Parse(s)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
