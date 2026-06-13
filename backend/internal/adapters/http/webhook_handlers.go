package http

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func handleListWebhooks(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, name, url, events, is_active, created_at FROM portal_config.webhook_subscriptions WHERE is_active = TRUE ORDER BY created_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list webhooks")
			return
		}
		defer rows.Close()

		var items []map[string]any
		for rows.Next() {
			var id uuid.UUID
			var name, url string
			var events []string
			var isActive bool
			var createdAt time.Time
			if err := rows.Scan(&id, &name, &url, &events, &isActive, &createdAt); err == nil {
				items = append(items, map[string]any{
					"id":         id,
					"name":       name,
					"url":        url,
					"events":     events,
					"is_active":  isActive,
					"created_at": createdAt,
				})
			}
		}
		respondJSON(w, http.StatusOK, map[string]any{"webhooks": items})
	}
}

func handleCreateWebhook(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name   string   `json:"name"`
			URL    string   `json:"url"`
			Events []string `json:"events"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		v := NewValidator()
		v.Required("name", req.Name, "name is required")
		v.Required("url", req.URL, "url is required")
		v.MaxLength("name", req.Name, 200)
		v.MaxLength("url", req.URL, 2000)
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		secret := uuid.New().String()
		_, err := pool.Exec(r.Context(), `
			INSERT INTO portal_config.webhook_subscriptions (name, url, secret, events, created_by)
			VALUES ($1, $2, $3, $4, $5)
		`, req.Name, req.URL, secret, req.Events, r.Context().Value(userIDKey))
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create webhook")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]string{"status": "created"})
	}
}

func handleDeleteWebhook(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		_, err := pool.Exec(r.Context(), `
			UPDATE portal_config.webhook_subscriptions SET is_active = FALSE WHERE id = $1
		`, id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete webhook")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}

func handleListWebhookDeliveries(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		subscriptionID := r.URL.Query().Get("subscription_id")
		query := `
			SELECT id, subscription_id, event, payload, response_status, response_body, error_message, created_at
			FROM portal_config.webhook_deliveries
		`
		args := []any{}
		if subscriptionID != "" {
			query += " WHERE subscription_id = $1"
			args = append(args, subscriptionID)
		}
		query += " ORDER BY created_at DESC LIMIT 100"

		rows, err := pool.Query(r.Context(), query, args...)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list deliveries")
			return
		}
		defer rows.Close()

		var items []map[string]any
		for rows.Next() {
			var id, subID uuid.UUID
			var event string
			var payload map[string]any
			var responseStatus int
			var responseBody, errorMsg string
			var createdAt time.Time
			if err := rows.Scan(&id, &subID, &event, &payload, &responseStatus, &responseBody, &errorMsg, &createdAt); err == nil {
				items = append(items, map[string]any{
					"id":              id,
					"subscription_id": subID,
					"event":           event,
					"payload":         payload,
					"response_status": responseStatus,
					"response_body":   responseBody,
					"error_message":   errorMsg,
					"created_at":      createdAt,
				})
			}
		}
		respondJSON(w, http.StatusOK, map[string]any{"deliveries": items})
	}
}

// deliverWebhook sends a webhook payload to a subscription URL.
func deliverWebhook(pool *pgxpool.Pool, subscriptionID uuid.UUID, event string, payload map[string]any) {
	ctx := context.Background()
	var url, secret string
	err := pool.QueryRow(ctx, `
		SELECT url, secret FROM portal_config.webhook_subscriptions WHERE id = $1 AND is_active = TRUE
	`, subscriptionID).Scan(&url, &secret)
	if err != nil {
		return
	}

	body, _ := json.Marshal(map[string]any{
		"event":     event,
		"timestamp": time.Now().UTC(),
		"data":      payload,
	})

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Event", event)

	// Sign payload
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	req.Header.Set("X-Webhook-Signature", hex.EncodeToString(mac.Sum(nil)))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	status := 0
	respBody := ""
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	} else {
		status = resp.StatusCode
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		respBody = buf.String()
		resp.Body.Close()
	}

	_, _ = pool.Exec(ctx, `
		INSERT INTO portal_config.webhook_deliveries (subscription_id, event, payload, response_status, response_body, delivered_at, error_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, subscriptionID, event, payload, status, respBody, time.Now(), errMsg)
}
