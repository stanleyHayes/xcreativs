package http

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/adapters/db"
	"xcreatives.com/backend/internal/domain"
)

func generateAPIKey() (full string, prefix string, hash string) {
	b := make([]byte, 32)
	rand.Read(b)
	full = "xc_" + hex.EncodeToString(b)
	prefix = full[:12]
	h := sha256.Sum256([]byte(full))
	hash = hex.EncodeToString(h[:])
	return
}

func handleCreateAPIKey(pool *pgxpool.Pool) http.HandlerFunc {
	identity := db.NewIdentityRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		var req struct {
			Name    string   `json:"name"`
			Scopes  []string `json:"scopes"`
			Expires string   `json:"expires"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
			respondError(w, http.StatusBadRequest, "name required")
			return
		}
		if len(req.Scopes) == 0 {
			req.Scopes = []string{"engagement_read"}
		}

		full, prefix, hash := generateAPIKey()
		var expires *time.Time
		if req.Expires != "" && req.Expires != "never" {
			if t, err := time.Parse(time.RFC3339, req.Expires); err == nil {
				expires = &t
			}
		}

		u, _ := identity.GetUserByID(r.Context(), userID)
		key := &domain.APIKey{
			UserID:    u.ID,
			Name:      req.Name,
			KeyHash:   hash,
			KeyPrefix: prefix,
			Scopes:    req.Scopes,
			ExpiresAt: expires,
			IsActive:  true,
		}
		if err := identity.CreateAPIKey(r.Context(), key); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create key")
			return
		}

		respondJSON(w, http.StatusCreated, map[string]any{
			"id":      key.ID,
			"name":    key.Name,
			"key":     full,
			"prefix":  prefix,
			"scopes":  key.Scopes,
			"expires": key.ExpiresAt,
		})
	}
}

func handleListAPIKeys(pool *pgxpool.Pool) http.HandlerFunc {
	identity := db.NewIdentityRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		keys, err := identity.ListAPIKeysByUser(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list keys")
			return
		}
		var safe []map[string]any
		for _, k := range keys {
			safe = append(safe, map[string]any{
				"id":           k.ID,
				"name":         k.Name,
				"prefix":       k.KeyPrefix,
				"scopes":       k.Scopes,
				"expires_at":   k.ExpiresAt,
				"last_used_at": k.LastUsedAt,
				"is_active":    k.IsActive,
				"created_at":   k.CreatedAt,
				"revoked_at":   k.RevokedAt,
			})
		}
		respondJSON(w, http.StatusOK, map[string]any{"keys": safe})
	}
}

func handleRevokeAPIKey(pool *pgxpool.Pool) http.HandlerFunc {
	identity := db.NewIdentityRepo(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if err := identity.RevokeAPIKey(r.Context(), id); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to revoke key")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "revoked"})
	}
}
