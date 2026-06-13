package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

func handleListAllEngagements(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		engagements, err := deps.Engagement.ListAllEngagements(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list engagements")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagements": engagements})
	}
}

func handleCreateEngagement(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Slug               string  `json:"slug"`
			ClientName         string  `json:"client_name"`
			Title              string  `json:"title"`
			Description        string  `json:"description"`
			Sector             string  `json:"sector"`
			ServiceLine        string  `json:"service_line"`
			Stage              string  `json:"stage"`
			StartDate          *string `json:"start_date"`
			TargetEndDate      *string `json:"target_end_date"`
			BudgetTotalUSD     *float64 `json:"budget_total_usd"`
			CurrencyPreference string  `json:"currency_preference"`
			IsWhiteLabel       bool    `json:"is_white_label"`
			WhiteLabelDomain   string  `json:"white_label_domain"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		v := NewValidator()
		v.Required("slug", req.Slug, "slug is required")
		v.Required("title", req.Title, "title is required")
		v.Required("client_name", req.ClientName, "client name is required")
		v.Required("sector", req.Sector, "sector is required")
		v.Required("service_line", req.ServiceLine, "service line is required")
		v.In("stage", req.Stage, "discovery", "scoping", "active", "paused", "completed", "archived")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		var startDate, targetEndDate *time.Time
		if req.StartDate != nil {
			t, _ := time.Parse("2006-01-02", *req.StartDate)
			startDate = &t
		}
		if req.TargetEndDate != nil {
			t, _ := time.Parse("2006-01-02", *req.TargetEndDate)
			targetEndDate = &t
		}

		eng := &domain.Engagement{
			ID:                 uuid.New(),
			Slug:               req.Slug,
			ClientName:         req.ClientName,
			Title:              req.Title,
			Description:        req.Description,
			Sector:             req.Sector,
			ServiceLine:        req.ServiceLine,
			Stage:              req.Stage,
			StartDate:          startDate,
			TargetEndDate:      targetEndDate,
			BudgetTotalUSD:     req.BudgetTotalUSD,
			CurrencyPreference: req.CurrencyPreference,
			IsWhiteLabel:       req.IsWhiteLabel,
			WhiteLabelDomain:   req.WhiteLabelDomain,
		}
		if err := deps.Engagement.CreateEngagement(r.Context(), eng); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create engagement")
			return
		}
		respondJSON(w, http.StatusCreated, eng)
	}
}
