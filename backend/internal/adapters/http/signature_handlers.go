package http

import (
	"encoding/json"
	"net/http"
	"net/mail"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

func handleListSignatureRequests(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		userID := r.Context().Value(userIDKey)
		var creatorFilter string
		if userID != nil {
			creatorFilter = userID.(string)
		}
		items, err := deps.Signature.ListSignatureRequests(r.Context(), status, creatorFilter)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list signatures")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"requests": items})
	}
}

func handleCreateSignatureRequest(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			DocumentType   string `json:"document_type"`
			EngagementID   string `json:"engagement_id"`
			RecipientEmail string `json:"recipient_email"`
			RecipientName  string `json:"recipient_name"`
			RecipientOrg   string `json:"recipient_org"`
			DocumentTitle  string `json:"document_title"`
			DocumentBody   string `json:"document_body"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.RecipientEmail == "" || req.DocumentTitle == "" || req.DocumentBody == "" {
			respondError(w, http.StatusBadRequest, "recipient_email, document_title, and document_body are required")
			return
		}
		if _, err := mail.ParseAddress(req.RecipientEmail); err != nil {
			respondError(w, http.StatusBadRequest, "invalid recipient_email")
			return
		}
		v := NewValidator()
		v.MaxLength("document_title", req.DocumentTitle, 500)
		v.MaxLength("document_body", req.DocumentBody, 100000)
		v.MaxLength("recipient_name", req.RecipientName, 200)
		v.MaxLength("recipient_org", req.RecipientOrg, 200)
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}
		validDocTypes := map[string]bool{"nda": true, "mou": true, "sow": true, "amendment": true}
		if !validDocTypes[req.DocumentType] {
			req.DocumentType = "nda"
		}

		userID := r.Context().Value(userIDKey).(string)
		creatorID, err := uuid.Parse(userID)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "invalid session")
			return
		}
		s := &domain.SignatureRequest{
			ID:               uuid.New(),
			DocumentType:     req.DocumentType,
			RecipientEmail:   req.RecipientEmail,
			RecipientName:    req.RecipientName,
			RecipientOrg:     req.RecipientOrg,
			DocumentTitle:    req.DocumentTitle,
			DocumentBody:     req.DocumentBody,
			ExternalProvider: "mock",
			Status:           "draft",
			CreatedBy:        creatorID,
		}
		if req.EngagementID != "" {
			id, err := uuid.Parse(req.EngagementID)
			if err != nil {
				respondError(w, http.StatusBadRequest, "invalid engagement_id")
				return
			}
			s.EngagementID = &id
		}

		if err := deps.Signature.CreateSignatureRequest(r.Context(), s); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create request")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"request_id": s.ID, "status": s.Status})
	}
}

func handleSendSignatureRequest(pool *pgxpool.Pool, baseURL string) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		sr, err := deps.Signature.GetSignatureRequest(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "request not found")
			return
		}
		if sr.Status != "draft" {
			respondError(w, http.StatusConflict, "request is not in draft status")
			return
		}

		signingURL := baseURL + "/en/sign/" + id
		expiresAt := time.Now().Add(7 * 24 * time.Hour)

		if err := deps.Signature.SendSignatureRequest(r.Context(), id, signingURL, expiresAt); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to send request")
			return
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"status":      "sent",
			"signing_url": signingURL,
			"expires_at":  expiresAt,
		})
	}
}

func handleGetSignatureRequest(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		req, err := deps.Signature.GetSignatureRequest(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "request not found")
			return
		}
		respondJSON(w, http.StatusOK, req)
	}
}

func handleUpdateSignatureStatus(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Status            string `json:"status"`
			SignedDocumentURL string `json:"signed_document_url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		validStatuses := map[string]bool{"draft": true, "sent": true, "signed": true, "expired": true, "cancelled": true}
		if !validStatuses[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		sr, err := deps.Signature.GetSignatureRequest(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "request not found")
			return
		}
		// Prevent invalid transitions
		if sr.Status == "signed" && req.Status != "signed" {
			respondError(w, http.StatusConflict, "cannot change status from signed")
			return
		}
		if sr.Status == "cancelled" {
			respondError(w, http.StatusConflict, "cannot change status from cancelled")
			return
		}
		if err := deps.Signature.UpdateSignatureStatus(r.Context(), id, req.Status, req.SignedDocumentURL); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update status")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}
