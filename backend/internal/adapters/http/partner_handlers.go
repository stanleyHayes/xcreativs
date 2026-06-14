package http

import (
	"encoding/json"
	"net/http"
	"net/mail"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// --- Public: Partnership Application ---

func handleApplyPartnership(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			OrgName         string   `json:"org_name"`
			OrgWebsite      string   `json:"org_website"`
			ContactName     string   `json:"contact_name"`
			ContactEmail    string   `json:"contact_email"`
			ContactPhone    string   `json:"contact_phone"`
			PartnerType     string   `json:"partner_type"`
			ExistingProduct string   `json:"existing_product"`
			DomainExpertise string   `json:"domain_expertise"`
			TractionMetrics string   `json:"traction_metrics"`
			WhatTheyNeed    string   `json:"what_they_need"`
			WhatTheyBring   string   `json:"what_they_bring"`
			TargetMarkets   []string `json:"target_markets"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.OrgName == "" || req.ContactName == "" || req.ContactEmail == "" || req.PartnerType == "" {
			respondError(w, http.StatusBadRequest, "missing required fields")
			return
		}
		if _, err := mail.ParseAddress(req.ContactEmail); err != nil {
			respondError(w, http.StatusBadRequest, "invalid contact_email")
			return
		}
		app := &domain.PartnerApplication{
			OrgName:         req.OrgName,
			OrgWebsite:      req.OrgWebsite,
			ContactName:     req.ContactName,
			ContactEmail:    req.ContactEmail,
			ContactPhone:    req.ContactPhone,
			PartnerType:     req.PartnerType,
			ExistingProduct: req.ExistingProduct,
			DomainExpertise: req.DomainExpertise,
			TractionMetrics: req.TractionMetrics,
			WhatTheyNeed:    req.WhatTheyNeed,
			WhatTheyBring:   req.WhatTheyBring,
			TargetMarkets:   req.TargetMarkets,
			Status:          "applied",
		}
		if err := deps.Partner.CreatePartnerApplication(r.Context(), app); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to submit application")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]string{"status": "submitted"})
	}
}

// --- Authenticated: Partner Portal ---

func handlePartnerDashboard(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondJSON(w, http.StatusOK, map[string]any{
				"partner":    nil,
				"products":   []any{},
				"agreements": []any{},
				"referrals":  []any{},
				"orders":     []any{},
			})
			return
		}
		products, _ := deps.Partner.ListPartnerProducts(r.Context(), partner.ID.String())
		agreements, _ := deps.Partner.ListPartnerAgreements(r.Context(), partner.ID.String())
		referrals, _ := deps.Partner.ListReferrals(r.Context(), partner.ID.String())
		orders, _ := deps.Partner.ListDistributionOrders(r.Context(), partner.ID.String())
		respondJSON(w, http.StatusOK, map[string]any{
			"partner":    partner,
			"products":   products,
			"agreements": agreements,
			"referrals":  referrals,
			"orders":     orders,
		})
	}
}

func handlePartnerProducts(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondError(w, http.StatusNotFound, "no partner association found")
			return
		}
		products, err := deps.Partner.ListPartnerProducts(r.Context(), partner.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list products")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"products": products})
	}
}

func handlePartnerAgreements(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondError(w, http.StatusNotFound, "no partner association found")
			return
		}
		agreements, err := deps.Partner.ListPartnerAgreements(r.Context(), partner.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list agreements")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"agreements": agreements})
	}
}

func handlePartnerReferrals(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondError(w, http.StatusNotFound, "no partner association found")
			return
		}
		referrals, err := deps.Partner.ListReferrals(r.Context(), partner.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list referrals")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"referrals": referrals})
	}
}

func handleCreateReferral(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondError(w, http.StatusNotFound, "no partner association found")
			return
		}
		var req struct {
			ReferredOrgName      string   `json:"referred_org_name"`
			ReferredContactName  string   `json:"referred_contact_name"`
			ReferredContactEmail string   `json:"referred_contact_email"`
			ReferredContactPhone string   `json:"referred_contact_phone"`
			OpportunityValue     *float64 `json:"opportunity_value"`
			Notes                string   `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.ReferredOrgName == "" {
			respondError(w, http.StatusBadRequest, "referred_org_name required")
			return
		}
		ref := &domain.Referral{
			PartnerID:            partner.ID,
			ReferredOrgName:      req.ReferredOrgName,
			ReferredContactName:  req.ReferredContactName,
			ReferredContactEmail: req.ReferredContactEmail,
			ReferredContactPhone: req.ReferredContactPhone,
			OpportunityValue:     req.OpportunityValue,
			Status:               "submitted",
			Notes:                req.Notes,
		}
		if err := deps.Partner.CreateReferral(r.Context(), ref); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create referral")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]string{"status": "created"})
	}
}

func handlePartnerOrders(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		partner, err := deps.Partner.GetPartnerByUser(r.Context(), userID)
		if err != nil || partner == nil {
			respondError(w, http.StatusNotFound, "no partner association found")
			return
		}
		orders, err := deps.Partner.ListDistributionOrders(r.Context(), partner.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list orders")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"orders": orders})
	}
}

// --- Admin: List all partner applications ---

func handleListPartnerApplications(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		apps, err := deps.Partner.ListPartnerApplications(r.Context(), status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list applications")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"applications": apps})
	}
}

func handleUpdatePartnerApplication(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Status string `json:"status"`
			Notes  string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		userID := r.Context().Value(userIDKey).(string)
		if err := deps.Partner.UpdatePartnerApplicationStatus(r.Context(), id, req.Status, userID, req.Notes); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update application")
			return
		}

		// If approved, auto-create partner record
		if req.Status == "approved" {
			app, _ := deps.Partner.GetPartnerApplication(r.Context(), id)
			if app != nil {
				partner := &domain.Partner{
					ApplicationID: &app.ID,
					OrgName:       app.OrgName,
					OrgWebsite:    app.OrgWebsite,
					ContactName:   app.ContactName,
					ContactEmail:  app.ContactEmail,
					ContactPhone:  app.ContactPhone,
					PartnerType:   app.PartnerType,
					Tier:          "standard",
					TargetMarkets: app.TargetMarkets,
					IsActive:      true,
				}
				_ = deps.Partner.CreatePartner(r.Context(), partner)
			}
		}

		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}
