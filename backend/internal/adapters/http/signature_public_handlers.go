package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func handleGetSigningPage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		sr, err := deps.Signature.GetSignatureRequest(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "signature request not found")
			return
		}

		if sr.Status == "expired" || (sr.ExpiresAt != nil && sr.ExpiresAt.Before(time.Now())) {
			respondError(w, http.StatusGone, "this signature request has expired")
			return
		}

		if sr.Status == "signed" {
			respondJSON(w, http.StatusOK, map[string]any{
				"status":              "already_signed",
				"document_title":      sr.DocumentTitle,
				"recipient_name":      sr.RecipientName,
				"signed_at":           sr.SignedAt,
				"signed_document_url": sr.SignedDocumentURL,
			})
			return
		}

		// Mark as viewed if currently sent
		if sr.Status == "sent" {
			_ = deps.Signature.UpdateSignatureStatus(r.Context(), id, "viewed", "")
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"id":             sr.ID,
			"document_title": sr.DocumentTitle,
			"document_body":  sr.DocumentBody,
			"recipient_name": sr.RecipientName,
			"recipient_org":  sr.RecipientOrg,
			"status":         sr.Status,
			"expires_at":     sr.ExpiresAt,
		})
	}
}

func handleSubmitSignature(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			SignatureData string `json:"signature_data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		sr, err := deps.Signature.GetSignatureRequest(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "signature request not found")
			return
		}

		if sr.Status == "expired" || (sr.ExpiresAt != nil && sr.ExpiresAt.Before(time.Now())) {
			respondError(w, http.StatusGone, "this signature request has expired")
			return
		}

		if sr.Status == "signed" {
			respondError(w, http.StatusConflict, "already signed")
			return
		}

		if req.SignatureData == "" {
			respondError(w, http.StatusBadRequest, "signature is required")
			return
		}

		if err := deps.Signature.UpdateSignatureStatus(r.Context(), id, "signed", req.SignatureData); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to record signature")
			return
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"status":  "signed",
			"message": "Thank you. Your signature has been recorded.",
		})
	}
}
