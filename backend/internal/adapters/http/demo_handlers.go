package http

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Embedded Demos (agent_plan.md §4.3): signed, time-limited SSO links into
// preview environments, scoped per engagement.

func handleListDemoLinks(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		engID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(engID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT id, label, target_url, token, expires_at::text, access_count, is_revoked, last_accessed_at::text, created_at::text
			FROM engagement.demo_links WHERE engagement_id = $1 ORDER BY created_at DESC
		`, engID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list demos")
			return
		}
		defer rows.Close()
		type demo struct {
			ID           string  `json:"id"`
			Label        string  `json:"label"`
			TargetURL    string  `json:"target_url"`
			AccessURL    string  `json:"access_url"`
			ExpiresAt    *string `json:"expires_at"`
			AccessCount  int     `json:"access_count"`
			IsRevoked    bool    `json:"is_revoked"`
			LastAccessed *string `json:"last_accessed_at"`
			CreatedAt    string  `json:"created_at"`
		}
		base := baseURL()
		list := []demo{}
		for rows.Next() {
			var d demo
			var token string
			if err := rows.Scan(&d.ID, &d.Label, &d.TargetURL, &token, &d.ExpiresAt, &d.AccessCount, &d.IsRevoked, &d.LastAccessed, &d.CreatedAt); err != nil {
				continue
			}
			d.AccessURL = base + "/api/v1/demos/" + token
			list = append(list, d)
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": engID, "demos": list})
	}
}

func handleCreateDemoLink(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		engID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(engID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		var req struct {
			Label          string `json:"label"`
			TargetURL      string `json:"target_url"`
			ExpiresInHours int    `json:"expires_in_hours"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.Label) == "" || !strings.HasPrefix(req.TargetURL, "http") {
			respondError(w, http.StatusBadRequest, "label and a valid target_url are required")
			return
		}
		var createdBy any
		if uid, _ := r.Context().Value(userIDKey).(string); uid != "" {
			createdBy = uid
		}
		var expires any
		if req.ExpiresInHours > 0 {
			expires = time.Now().Add(time.Duration(req.ExpiresInHours) * time.Hour)
		}
		token := randomToken()
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO engagement.demo_links (engagement_id, label, target_url, token, expires_at, created_by)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
		`, engID, req.Label, req.TargetURL, token, expires, createdBy).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create demo link")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id, "access_url": baseURL() + "/api/v1/demos/" + token})
	}
}

func handleRevokeDemoLink(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid demo id")
			return
		}
		ct, err := pool.Exec(r.Context(), `UPDATE engagement.demo_links SET is_revoked = TRUE WHERE id = $1`, id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to revoke")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "demo not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "revoked"})
	}
}

// handleAccessDemo validates a demo token and redirects into the preview
// environment with the token forwarded for SSO. Public (token-gated).
func handleAccessDemo(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := chi.URLParam(r, "token")
		var target string
		var revoked bool
		var expired bool
		err := pool.QueryRow(r.Context(), `
			SELECT target_url, is_revoked, (expires_at IS NOT NULL AND expires_at < NOW())
			FROM engagement.demo_links WHERE token = $1
		`, token).Scan(&target, &revoked, &expired)
		if err != nil {
			respondError(w, http.StatusNotFound, "demo link not found")
			return
		}
		if revoked {
			respondError(w, http.StatusForbidden, "this demo link has been revoked")
			return
		}
		if expired {
			respondError(w, http.StatusGone, "this demo link has expired")
			return
		}
		_, _ = pool.Exec(r.Context(), `UPDATE engagement.demo_links SET access_count = access_count + 1, last_accessed_at = NOW() WHERE token = $1`, token)
		sep := "?"
		if strings.Contains(target, "?") {
			sep = "&"
		}
		http.Redirect(w, r, target+sep+"sso_token="+url.QueryEscape(token), http.StatusFound)
	}
}
