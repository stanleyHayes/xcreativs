package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Capability Lattice Tracker write side (agent_plan.md §4.3): the
// delivered / in-flight / queued / deferred state machine over
// engagement.capability_deliveries. The list endpoint already exists.

var capabilityStatuses = map[string]bool{"delivered": true, "in_flight": true, "queued": true, "deferred": true}

func handleCreateCapability(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		engID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(engID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		var req struct {
			CapabilityName string `json:"capability_name"`
			Status         string `json:"status"`
			ReasonDeferred string `json:"reason_deferred"`
			SortOrder      int    `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.CapabilityName) == "" {
			respondError(w, http.StatusBadRequest, "capability_name is required")
			return
		}
		if !capabilityStatuses[req.Status] {
			req.Status = "queued"
		}
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO engagement.capability_deliveries (engagement_id, capability_name, status, reason_deferred, sort_order, delivered_at)
			VALUES ($1, $2, $3, $4, $5, CASE WHEN $3 = 'delivered' THEN NOW() ELSE NULL END)
			RETURNING id
		`, engID, req.CapabilityName, req.Status, req.ReasonDeferred, req.SortOrder).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create capability")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id, "status": req.Status})
	}
}

func handleUpdateCapability(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cid := chi.URLParam(r, "cid")
		if _, err := uuid.Parse(cid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid capability id")
			return
		}
		var req struct {
			CapabilityName string `json:"capability_name"`
			Status         string `json:"status"`
			ReasonDeferred string `json:"reason_deferred"`
			SortOrder      *int   `json:"sort_order"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Status != "" && !capabilityStatuses[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		// delivered_at is set the first time status becomes 'delivered'.
		ct, err := pool.Exec(r.Context(), `
			UPDATE engagement.capability_deliveries
			SET capability_name = COALESCE(NULLIF($1,''), capability_name),
			    status = COALESCE(NULLIF($2,''), status),
			    reason_deferred = $3,
			    sort_order = COALESCE($4, sort_order),
			    delivered_at = CASE WHEN $2 = 'delivered' AND delivered_at IS NULL THEN NOW()
			                        WHEN $2 <> '' AND $2 <> 'delivered' THEN NULL
			                        ELSE delivered_at END,
			    updated_at = NOW()
			WHERE id = $5
		`, req.CapabilityName, req.Status, req.ReasonDeferred, req.SortOrder, cid)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update capability")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "capability not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

func handleDeleteCapability(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cid := chi.URLParam(r, "cid")
		if _, err := uuid.Parse(cid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid capability id")
			return
		}
		if _, err := pool.Exec(r.Context(), `DELETE FROM engagement.capability_deliveries WHERE id = $1`, cid); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete capability")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}
