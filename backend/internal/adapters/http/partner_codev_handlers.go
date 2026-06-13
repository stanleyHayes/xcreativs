package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Partner co-development workspace + distribution training (agent_plan.md §5.1).

func partnerIDForUser(pool *pgxpool.Pool, r *http.Request) string {
	uid, _ := r.Context().Value(userIDKey).(string)
	if uid == "" {
		return ""
	}
	var pid string
	_ = pool.QueryRow(r.Context(), `SELECT partner_id FROM partner.partner_users WHERE user_id = $1 LIMIT 1`, uid).Scan(&pid)
	return pid
}

// --- Co-development workspace ---

func handleListCodevItems(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pid := chi.URLParam(r, "pid")
		if _, err := uuid.Parse(pid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid product id")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT id, item_type, title, description, status, owner, due_date::text, sort_order
			FROM partner.codev_items WHERE product_id = $1 ORDER BY sort_order, created_at
		`, pid)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list items")
			return
		}
		defer rows.Close()
		type item struct {
			ID          string  `json:"id"`
			ItemType    string  `json:"item_type"`
			Title       string  `json:"title"`
			Description string  `json:"description"`
			Status      string  `json:"status"`
			Owner       string  `json:"owner"`
			DueDate     *string `json:"due_date"`
			SortOrder   int     `json:"sort_order"`
		}
		list := []item{}
		for rows.Next() {
			var it item
			if rows.Scan(&it.ID, &it.ItemType, &it.Title, &it.Description, &it.Status, &it.Owner, &it.DueDate, &it.SortOrder) == nil {
				list = append(list, it)
			}
		}
		respondJSON(w, http.StatusOK, map[string]any{"product_id": pid, "items": list})
	}
}

func handleCreateCodevItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pid := chi.URLParam(r, "pid")
		if _, err := uuid.Parse(pid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid product id")
			return
		}
		var req struct {
			ItemType    string `json:"item_type"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Status      string `json:"status"`
			Owner       string `json:"owner"`
			DueDate     string `json:"due_date"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.Title) == "" {
			respondError(w, http.StatusBadRequest, "title is required")
			return
		}
		if req.ItemType == "" {
			req.ItemType = "task"
		}
		if req.Status == "" {
			req.Status = "open"
		}
		var due any
		if req.DueDate != "" {
			due = req.DueDate
		}
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO partner.codev_items (product_id, item_type, title, description, status, owner, due_date)
			VALUES ($1, $2, $3, $4, $5, $6, $7::date) RETURNING id
		`, pid, req.ItemType, req.Title, req.Description, req.Status, req.Owner, due).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create item")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id})
	}
}

func handleUpdateCodevItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid item id")
			return
		}
		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			Status      string `json:"status"`
			Owner       string `json:"owner"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE partner.codev_items
			SET title = COALESCE(NULLIF($1,''), title), description = $2,
			    status = COALESCE(NULLIF($3,''), status), owner = $4, updated_at = NOW()
			WHERE id = $5
		`, req.Title, req.Description, req.Status, req.Owner, id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update item")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "item not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

func handleDeleteCodevItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid item id")
			return
		}
		if _, err := pool.Exec(r.Context(), `DELETE FROM partner.codev_items WHERE id = $1`, id); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete item")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}

// --- Distribution: training ---

func handleListTrainingModules(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pid := partnerIDForUser(pool, r)
		rows, err := pool.Query(r.Context(), `
			SELECT m.id, m.slug, m.title, m.description, m.content_url, m.duration_minutes,
			       (tc.id IS NOT NULL) AS completed, tc.completed_at::text
			FROM partner.training_modules m
			LEFT JOIN partner.training_completions tc ON tc.module_id = m.id AND tc.partner_id = $1
			WHERE m.is_active = TRUE ORDER BY m.sort_order, m.created_at
		`, pidOrNil(pid))
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list modules")
			return
		}
		defer rows.Close()
		type mod struct {
			ID              string  `json:"id"`
			Slug            string  `json:"slug"`
			Title           string  `json:"title"`
			Description     string  `json:"description"`
			ContentURL      string  `json:"content_url"`
			DurationMinutes int     `json:"duration_minutes"`
			Completed       bool    `json:"completed"`
			CompletedAt     *string `json:"completed_at"`
		}
		list := []mod{}
		done := 0
		for rows.Next() {
			var m mod
			if rows.Scan(&m.ID, &m.Slug, &m.Title, &m.Description, &m.ContentURL, &m.DurationMinutes, &m.Completed, &m.CompletedAt) == nil {
				if m.Completed {
					done++
				}
				list = append(list, m)
			}
		}
		respondJSON(w, http.StatusOK, map[string]any{"modules": list, "completed": done, "total": len(list)})
	}
}

func pidOrNil(pid string) any {
	if pid == "" {
		return nil
	}
	return pid
}

func handleCompleteTraining(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pid := partnerIDForUser(pool, r)
		if pid == "" {
			respondError(w, http.StatusForbidden, "not linked to a partner")
			return
		}
		moduleID := chi.URLParam(r, "moduleId")
		if _, err := uuid.Parse(moduleID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid module id")
			return
		}
		var req struct {
			Score *int `json:"score"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		_, err := pool.Exec(r.Context(), `
			INSERT INTO partner.training_completions (partner_id, module_id, score)
			VALUES ($1, $2, $3)
			ON CONFLICT (partner_id, module_id) DO UPDATE SET score = EXCLUDED.score, completed_at = NOW()
		`, pid, moduleID, req.Score)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to record completion")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "completed"})
	}
}

func handleCreateTrainingModule(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Slug            string `json:"slug"`
			Title           string `json:"title"`
			Description     string `json:"description"`
			ContentURL      string `json:"content_url"`
			DurationMinutes int    `json:"duration_minutes"`
			SortOrder       int    `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.Slug) == "" || strings.TrimSpace(req.Title) == "" {
			respondError(w, http.StatusBadRequest, "slug and title are required")
			return
		}
		if req.DurationMinutes <= 0 {
			req.DurationMinutes = 30
		}
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO partner.training_modules (slug, title, description, content_url, duration_minutes, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
		`, req.Slug, req.Title, req.Description, req.ContentURL, req.DurationMinutes, req.SortOrder).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create module (slug may exist)")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id})
	}
}

// handlePartnerPerformance aggregates referral + distribution commission and
// regional reach for the authenticated partner.
func handlePartnerPerformance(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pid := partnerIDForUser(pool, r)
		if pid == "" {
			respondError(w, http.StatusForbidden, "not linked to a partner")
			return
		}
		var refTotal, refConverted int
		var refCommission, orderCommission, orderRevenue float64
		var orders int
		_ = pool.QueryRow(r.Context(), `SELECT count(*), count(*) FILTER (WHERE status='converted'), COALESCE(sum(commission_amount),0) FROM partner.referrals WHERE partner_id=$1`, pid).Scan(&refTotal, &refConverted, &refCommission)
		_ = pool.QueryRow(r.Context(), `SELECT count(*), COALESCE(sum(commission_amount),0), COALESCE(sum(total_value),0) FROM partner.distribution_orders WHERE partner_id=$1`, pid).Scan(&orders, &orderCommission, &orderRevenue)
		var markets []string
		var m []byte
		_ = pool.QueryRow(r.Context(), `SELECT target_markets FROM partner.partners WHERE id=$1`, pid).Scan(&m)
		_ = json.Unmarshal(m, &markets)
		if markets == nil {
			markets = []string{}
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"referrals":            map[string]any{"total": refTotal, "converted": refConverted, "commission_usd": refCommission},
			"distribution":         map[string]any{"orders": orders, "commission_usd": orderCommission, "revenue_usd": orderRevenue},
			"total_commission_usd": refCommission + orderCommission,
			"regional_markets":     markets,
		})
	}
}
