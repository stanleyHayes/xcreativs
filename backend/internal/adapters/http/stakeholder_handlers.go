package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Stakeholder Map (agent_plan.md §4.3). Self-contained: direct pool access, no
// change to the shared repository interfaces.

type stakeholder struct {
	ID           string `json:"id"`
	EngagementID string `json:"engagement_id"`
	Name         string `json:"name"`
	Role         string `json:"role"`
	Organization string `json:"organization"`
	Influence    string `json:"influence"`
	Interest     string `json:"interest"`
	Sentiment    string `json:"sentiment"`
	Notes        string `json:"notes"`
}

var stakeholderInfluence = map[string]bool{"low": true, "medium": true, "high": true}
var stakeholderSentiment = map[string]bool{"supporter": true, "neutral": true, "skeptic": true, "blocker": true}

func normStakeholder(s *stakeholder) {
	if !stakeholderInfluence[s.Influence] {
		s.Influence = "medium"
	}
	if !stakeholderInfluence[s.Interest] {
		s.Interest = "medium"
	}
	if !stakeholderSentiment[s.Sentiment] {
		s.Sentiment = "neutral"
	}
}

func handleListStakeholders(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT id, engagement_id, name, role, organization, influence, interest, sentiment, notes
			FROM engagement.stakeholders WHERE engagement_id = $1 ORDER BY created_at ASC
		`, id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list stakeholders")
			return
		}
		defer rows.Close()
		list := []stakeholder{}
		for rows.Next() {
			var s stakeholder
			if err := rows.Scan(&s.ID, &s.EngagementID, &s.Name, &s.Role, &s.Organization, &s.Influence, &s.Interest, &s.Sentiment, &s.Notes); err != nil {
				continue
			}
			list = append(list, s)
		}
		respondJSON(w, http.StatusOK, map[string]any{"engagement_id": id, "stakeholders": list})
	}
}

func handleCreateStakeholder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid engagement id")
			return
		}
		var s stakeholder
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(s.Name) == "" {
			respondError(w, http.StatusBadRequest, "name is required")
			return
		}
		normStakeholder(&s)
		var newID string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO engagement.stakeholders (engagement_id, name, role, organization, influence, interest, sentiment, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
		`, id, s.Name, s.Role, s.Organization, s.Influence, s.Interest, s.Sentiment, s.Notes).Scan(&newID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create stakeholder")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": newID, "status": "created"})
	}
}

func handleUpdateStakeholder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sid := chi.URLParam(r, "sid")
		if _, err := uuid.Parse(sid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid stakeholder id")
			return
		}
		var s stakeholder
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(s.Name) == "" {
			respondError(w, http.StatusBadRequest, "name is required")
			return
		}
		normStakeholder(&s)
		ct, err := pool.Exec(r.Context(), `
			UPDATE engagement.stakeholders
			SET name = $1, role = $2, organization = $3, influence = $4, interest = $5, sentiment = $6, notes = $7, updated_at = NOW()
			WHERE id = $8
		`, s.Name, s.Role, s.Organization, s.Influence, s.Interest, s.Sentiment, s.Notes, sid)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update stakeholder")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "stakeholder not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

func handleDeleteStakeholder(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sid := chi.URLParam(r, "sid")
		if _, err := uuid.Parse(sid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid stakeholder id")
			return
		}
		if _, err := pool.Exec(r.Context(), `DELETE FROM engagement.stakeholders WHERE id = $1`, sid); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete stakeholder")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}
