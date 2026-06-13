package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// Unified notification dispatcher (agent_plan.md §4.5): in-app + email, plus
// optional SMS / WhatsApp via Twilio when configured. Respects per-user
// preferences and digest options.

type notifyPrefs struct {
	EmailEnabled    bool
	InAppEnabled    bool
	SMSEnabled      bool
	WhatsAppEnabled bool
	DigestFrequency string
	Phone           string
}

func loadNotifyPrefs(ctx context.Context, pool *pgxpool.Pool, userID string) notifyPrefs {
	p := notifyPrefs{EmailEnabled: true, InAppEnabled: true, DigestFrequency: "instant"}
	_ = pool.QueryRow(ctx, `
		SELECT email_enabled, inapp_enabled, sms_enabled, whatsapp_enabled, digest_frequency, phone
		FROM comms.notification_preferences WHERE user_id = $1
	`, userID).Scan(&p.EmailEnabled, &p.InAppEnabled, &p.SMSEnabled, &p.WhatsAppEnabled, &p.DigestFrequency, &p.Phone)
	return p
}

// sendTwilio posts a message via the Twilio Messages API. channel is "sms" or
// "whatsapp". Returns nil silently (no-op) when Twilio is not configured.
func sendTwilio(ctx context.Context, channel, to, body string) {
	sid := os.Getenv("TWILIO_ACCOUNT_SID")
	token := os.Getenv("TWILIO_AUTH_TOKEN")
	if sid == "" || token == "" || to == "" {
		return
	}
	from := os.Getenv("TWILIO_FROM")
	if channel == "whatsapp" {
		from = os.Getenv("TWILIO_WHATSAPP_FROM")
		to = "whatsapp:" + to
	}
	if from == "" {
		return
	}
	form := url.Values{}
	form.Set("To", to)
	form.Set("From", from)
	form.Set("Body", body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.twilio.com/2010-04-01/Accounts/"+sid+"/Messages.json", strings.NewReader(form.Encode()))
	if err != nil {
		return
	}
	req.SetBasicAuth(sid, token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err == nil {
		_ = resp.Body.Close()
	}
}

// dispatchNotification records an in-app notification and delivers it across the
// user's enabled channels (email immediately for instant digest; SMS/WhatsApp if
// configured). Daily/weekly digest users receive the in-app row now and the
// email later via the digest sender.
func dispatchNotification(ctx context.Context, pool *pgxpool.Pool, emailSender domain.EmailSender, userID, title, body, notifType string) {
	prefs := loadNotifyPrefs(ctx, pool, userID)

	if prefs.InAppEnabled {
		_, _ = pool.Exec(ctx, `
			INSERT INTO comms.notifications (user_id, title, body, notification_type, channel, is_read, sent_at)
			VALUES ($1, $2, $3, $4, 'in_app', FALSE, NOW())
		`, userID, title, body, notifType)
	}

	var email string
	_ = pool.QueryRow(ctx, `SELECT email FROM identity.users WHERE id = $1`, userID).Scan(&email)

	if prefs.EmailEnabled && prefs.DigestFrequency == "instant" && emailSender != nil && email != "" {
		html := "<p>" + strings.ReplaceAll(body, "\n", "<br>") + "</p>"
		go func() { _ = emailSender.Send(context.Background(), email, title, html, body) }()
	}
	if prefs.SMSEnabled {
		go sendTwilio(context.Background(), "sms", prefs.Phone, title+": "+body)
	}
	if prefs.WhatsAppEnabled {
		go sendTwilio(context.Background(), "whatsapp", prefs.Phone, title+": "+body)
	}
}

// --- Preferences API ---

func handleGetNotificationPreferences(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, _ := r.Context().Value(userIDKey).(string)
		if uid == "" {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		var p struct {
			EmailEnabled    bool     `json:"email_enabled"`
			InAppEnabled    bool     `json:"inapp_enabled"`
			SMSEnabled      bool     `json:"sms_enabled"`
			WhatsAppEnabled bool     `json:"whatsapp_enabled"`
			DigestFrequency string   `json:"digest_frequency"`
			Phone           string   `json:"phone"`
			Segments        []string `json:"segments"`
		}
		p.EmailEnabled, p.InAppEnabled, p.DigestFrequency = true, true, "instant"
		var segs []byte
		err := pool.QueryRow(r.Context(), `
			SELECT email_enabled, inapp_enabled, sms_enabled, whatsapp_enabled, digest_frequency, phone, segments
			FROM comms.notification_preferences WHERE user_id = $1
		`, uid).Scan(&p.EmailEnabled, &p.InAppEnabled, &p.SMSEnabled, &p.WhatsAppEnabled, &p.DigestFrequency, &p.Phone, &segs)
		if err == nil {
			_ = json.Unmarshal(segs, &p.Segments)
		}
		if p.Segments == nil {
			p.Segments = []string{}
		}
		respondJSON(w, http.StatusOK, p)
	}
}

func handleUpdateNotificationPreferences(pool *pgxpool.Pool) http.HandlerFunc {
	validFreq := map[string]bool{"instant": true, "daily": true, "weekly": true, "off": true}
	return func(w http.ResponseWriter, r *http.Request) {
		uid, _ := r.Context().Value(userIDKey).(string)
		if uid == "" {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		var req struct {
			EmailEnabled    bool     `json:"email_enabled"`
			InAppEnabled    bool     `json:"inapp_enabled"`
			SMSEnabled      bool     `json:"sms_enabled"`
			WhatsAppEnabled bool     `json:"whatsapp_enabled"`
			DigestFrequency string   `json:"digest_frequency"`
			Phone           string   `json:"phone"`
			Segments        []string `json:"segments"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if !validFreq[req.DigestFrequency] {
			req.DigestFrequency = "instant"
		}
		if req.Segments == nil {
			req.Segments = []string{}
		}
		segs, _ := json.Marshal(req.Segments)
		_, err := pool.Exec(r.Context(), `
			INSERT INTO comms.notification_preferences (user_id, email_enabled, inapp_enabled, sms_enabled, whatsapp_enabled, digest_frequency, phone, segments, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
			ON CONFLICT (user_id) DO UPDATE SET
			    email_enabled = EXCLUDED.email_enabled, inapp_enabled = EXCLUDED.inapp_enabled,
			    sms_enabled = EXCLUDED.sms_enabled, whatsapp_enabled = EXCLUDED.whatsapp_enabled,
			    digest_frequency = EXCLUDED.digest_frequency, phone = EXCLUDED.phone,
			    segments = EXCLUDED.segments, updated_at = NOW()
		`, uid, req.EmailEnabled, req.InAppEnabled, req.SMSEnabled, req.WhatsAppEnabled, req.DigestFrequency, req.Phone, segs)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to save preferences")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "saved"})
	}
}

// handleSendDigests batches unread in-app notifications into one email per user
// whose digest window is due. Intended to be triggered by a scheduler/cron.
func handleSendDigests(pool *pgxpool.Pool, emailSender domain.EmailSender) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		freq := r.URL.Query().Get("frequency")
		if freq != "daily" && freq != "weekly" {
			freq = "daily"
		}
		interval := "1 day"
		if freq == "weekly" {
			interval = "7 days"
		}
		rows, err := pool.Query(r.Context(), `
			SELECT p.user_id, u.email
			FROM comms.notification_preferences p
			JOIN identity.users u ON u.id = p.user_id
			WHERE p.digest_frequency = $1 AND p.email_enabled = TRUE
			  AND (p.digest_last_sent_at IS NULL OR p.digest_last_sent_at < NOW() - $2::interval)
		`, freq, interval)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to load digest recipients")
			return
		}
		type rec struct{ id, email string }
		var recipients []rec
		for rows.Next() {
			var x rec
			if rows.Scan(&x.id, &x.email) == nil {
				recipients = append(recipients, x)
			}
		}
		rows.Close()

		sent := 0
		for _, x := range recipients {
			irows, err := pool.Query(r.Context(), `
				SELECT title, body FROM comms.notifications
				WHERE user_id = $1 AND created_at > NOW() - $2::interval
				ORDER BY created_at DESC LIMIT 50
			`, x.id, interval)
			if err != nil {
				continue
			}
			var lines []string
			for irows.Next() {
				var t, b string
				if irows.Scan(&t, &b) == nil {
					lines = append(lines, "• "+t+" — "+b)
				}
			}
			irows.Close()
			if len(lines) == 0 {
				continue
			}
			body := "Here is your " + freq + " activity digest:\n\n" + strings.Join(lines, "\n")
			html := "<p>Here is your " + freq + " activity digest:</p><ul><li>" +
				strings.ReplaceAll(strings.Join(lines, "</li><li>"), "• ", "") + "</li></ul>"
			if emailSender != nil && x.email != "" {
				_ = emailSender.Send(r.Context(), x.email, "Your "+freq+" XCreativs digest", html, body)
			}
			_, _ = pool.Exec(r.Context(), `UPDATE comms.notification_preferences SET digest_last_sent_at = NOW() WHERE user_id = $1`, x.id)
			sent++
		}
		respondJSON(w, http.StatusOK, map[string]any{"frequency": freq, "digests_sent": sent})
	}
}

// handleBroadcastNotification performs segmented delivery: send a notification
// to every user whose preferences include the target segment, via the unified
// dispatcher (agent_plan.md §4.5).
func handleBroadcastNotification(pool *pgxpool.Pool, emailSender domain.EmailSender) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Segment string `json:"segment"`
			Title   string `json:"title"`
			Body    string `json:"body"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Segment == "" || req.Title == "" {
			respondError(w, http.StatusBadRequest, "segment and title are required")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT user_id FROM comms.notification_preferences WHERE segments @> $1::jsonb
		`, `["`+req.Segment+`"]`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to resolve segment")
			return
		}
		var ids []string
		for rows.Next() {
			var id string
			if rows.Scan(&id) == nil {
				ids = append(ids, id)
			}
		}
		rows.Close()
		for _, id := range ids {
			dispatchNotification(r.Context(), pool, emailSender, id, req.Title, req.Body, "broadcast")
		}
		respondJSON(w, http.StatusOK, map[string]any{"segment": req.Segment, "recipients": len(ids)})
	}
}
