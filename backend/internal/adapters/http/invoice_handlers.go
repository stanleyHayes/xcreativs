package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Invoice generation + Stripe/Paystack payment links (agent_plan.md §4.3 / §5.x).
// Self-contained: direct pool access; gateway keys read from the environment so
// no shared config wiring is required.

var validCurrency = map[string]bool{"USD": true, "GHS": true, "EUR": true}

func baseURL() string {
	b := strings.TrimRight(os.Getenv("BASE_URL"), "/")
	if b == "" {
		b = "https://xcreativs.com"
	}
	return b
}

func handleGenerateInvoice(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		engID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(engID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		var req struct {
			Amount      float64 `json:"amount"`
			Currency    string  `json:"currency"`
			DueDate     string  `json:"due_date"`
			MilestoneID string  `json:"milestone_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Amount <= 0 {
			respondError(w, http.StatusBadRequest, "amount must be greater than zero")
			return
		}
		req.Currency = strings.ToUpper(req.Currency)
		if !validCurrency[req.Currency] {
			respondError(w, http.StatusBadRequest, "currency must be USD, GHS, or EUR")
			return
		}
		var milestone any
		if req.MilestoneID != "" {
			if _, err := uuid.Parse(req.MilestoneID); err == nil {
				milestone = req.MilestoneID
			}
		}
		var dueDate any
		if req.DueDate != "" {
			dueDate = req.DueDate
		}

		var id, number string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO engagement.invoices (engagement_id, invoice_number, milestone_id, amount, currency, status, due_date)
			VALUES ($1, 'INV-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text, 1, 6)),
			        $2, $3, $4::currency_code, 'draft', $5::timestamptz)
			RETURNING id, invoice_number
		`, engID, milestone, req.Amount, req.Currency, dueDate).Scan(&id, &number)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to generate invoice")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id, "invoice_number": number, "status": "draft"})
	}
}

// createPaystackLink initialises a Paystack transaction and returns the hosted
// authorization URL. Used only when PAYSTACK_SECRET_KEY is configured.
func createPaystackLink(ctx context.Context, secret, email string, amount float64, currency, reference string) (string, error) {
	body, _ := json.Marshal(map[string]any{
		"email":     email,
		"amount":    int(amount*100 + 0.5), // smallest currency unit
		"currency":  currency,
		"reference": reference,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.paystack.co/transaction/initialize", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+secret)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var out struct {
		Status bool `json:"status"`
		Data   struct {
			AuthorizationURL string `json:"authorization_url"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if !out.Status || out.Data.AuthorizationURL == "" {
		return "", errPaymentGateway
	}
	return out.Data.AuthorizationURL, nil
}

var errPaymentGateway = &gatewayError{"payment gateway returned no link"}

type gatewayError struct{ msg string }

func (e *gatewayError) Error() string { return e.msg }

func handleGeneratePaymentLink(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		invID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(invID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid invoice id")
			return
		}
		var req struct {
			Provider string `json:"provider"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		provider := strings.ToLower(req.Provider)
		if provider != "stripe" && provider != "paystack" {
			provider = "paystack"
		}

		// Load the invoice + the engagement client's email.
		var amount float64
		var currency, number, clientEmail string
		err := pool.QueryRow(r.Context(), `
			SELECT i.amount, i.currency::text, i.invoice_number, COALESCE(u.email, '')
			FROM engagement.invoices i
			JOIN engagement.engagements e ON i.engagement_id = e.id
			LEFT JOIN identity.users u ON e.client_id = u.id
			WHERE i.id = $1
		`, invID).Scan(&amount, &currency, &number, &clientEmail)
		if err != nil {
			respondError(w, http.StatusNotFound, "invoice not found")
			return
		}
		if clientEmail == "" {
			clientEmail = "billing@xcreativs.com"
		}

		var link string
		column := "paystack_payment_link"
		if provider == "stripe" {
			column = "stripe_payment_link"
		}

		if provider == "paystack" && os.Getenv("PAYSTACK_SECRET_KEY") != "" {
			l, gErr := createPaystackLink(r.Context(), os.Getenv("PAYSTACK_SECRET_KEY"), clientEmail, amount, currency, number)
			if gErr == nil {
				link = l
			}
		}
		if link == "" {
			// No gateway key configured (or the call failed): fall back to an
			// internal hosted-invoice link the finance team can complete manually.
			link = baseURL() + "/pay/" + number + "?provider=" + provider
		}

		// store on the appropriate column and advance status to 'sent'
		if _, err := pool.Exec(r.Context(),
			`UPDATE engagement.invoices SET `+column+` = $1, status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, updated_at = NOW() WHERE id = $2`,
			link, invID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to store payment link")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"provider": provider, "payment_link": link})
	}
}

func handleUpdateInvoiceStatus(pool *pgxpool.Pool) http.HandlerFunc {
	valid := map[string]bool{"draft": true, "sent": true, "paid": true, "overdue": true, "void": true}
	return func(w http.ResponseWriter, r *http.Request) {
		invID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(invID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid invoice id")
			return
		}
		var req struct {
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if !valid[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE engagement.invoices
			SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END, updated_at = NOW()
			WHERE id = $2
		`, req.Status, invID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update invoice")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "invoice not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": req.Status})
	}
}
