package http

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

func handleGetClientTheme(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		engagementID := r.URL.Query().Get("engagement_id")
		if engagementID == "" {
			respondError(w, http.StatusBadRequest, "engagement_id required")
			return
		}
		theme, err := deps.PortalConfig.GetClientThemeByEngagement(r.Context(), engagementID)
		if err != nil {
			respondJSON(w, http.StatusOK, map[string]any{
				"theme": nil,
				"default": map[string]string{
					"client_name":     "XCreativs",
					"primary_color":   "#0066CC",
					"secondary_color": "#000000",
				},
			})
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"theme": theme})
	}
}

func handleUpsertClientTheme(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			EngagementID     string `json:"engagement_id"`
			ClientName       string `json:"client_name"`
			PrimaryColor     string `json:"primary_color"`
			SecondaryColor   string `json:"secondary_color"`
			LogoURL          string `json:"logo_url"`
			FaviconURL       string `json:"favicon_url"`
			EmailFromName    string `json:"email_from_name"`
			EmailFromAddress string `json:"email_from_address"`
			CustomCSS        string `json:"custom_css"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("client_name", req.ClientName, "client_name is required")
		v.MaxLength("client_name", req.ClientName, 200)
		v.MaxLength("primary_color", req.PrimaryColor, 20)
		v.MaxLength("secondary_color", req.SecondaryColor, 20)
		v.MaxLength("logo_url", req.LogoURL, 1000)
		v.MaxLength("favicon_url", req.FaviconURL, 1000)
		v.MaxLength("email_from_name", req.EmailFromName, 100)
		v.MaxLength("email_from_address", req.EmailFromAddress, 200)
		v.Email("email_from_address", req.EmailFromAddress)
		v.MaxLength("custom_css", req.CustomCSS, 50000)
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		engagementID, err := uuid.Parse(req.EngagementID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement_id")
			return
		}
		t := &domain.ClientTheme{
			ID:               uuid.New(),
			EngagementID:     engagementID,
			ClientName:       req.ClientName,
			PrimaryColor:     req.PrimaryColor,
			SecondaryColor:   req.SecondaryColor,
			LogoURL:          req.LogoURL,
			FaviconURL:       req.FaviconURL,
			EmailFromName:    req.EmailFromName,
			EmailFromAddress: req.EmailFromAddress,
			CustomCSS:        req.CustomCSS,
			IsActive:         true,
		}
		if err := deps.PortalConfig.UpsertClientTheme(r.Context(), t); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to save theme")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "saved"})
	}
}
