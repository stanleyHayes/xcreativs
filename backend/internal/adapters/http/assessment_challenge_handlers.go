package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// Technical Assessment Challenges (agent_plan.md §4.4): a challenge library,
// per-applicant assignment with a token-gated candidate flow, and review.

func handleListChallenges(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, slug, title, description, prompt, skills, time_limit_minutes, is_active
			FROM talent.assessment_challenges ORDER BY created_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list challenges")
			return
		}
		defer rows.Close()
		type ch struct {
			ID               string   `json:"id"`
			Slug             string   `json:"slug"`
			Title            string   `json:"title"`
			Description      string   `json:"description"`
			Prompt           string   `json:"prompt"`
			Skills           []string `json:"skills"`
			TimeLimitMinutes int      `json:"time_limit_minutes"`
			IsActive         bool     `json:"is_active"`
		}
		list := []ch{}
		for rows.Next() {
			var c ch
			var skills []byte
			if err := rows.Scan(&c.ID, &c.Slug, &c.Title, &c.Description, &c.Prompt, &skills, &c.TimeLimitMinutes, &c.IsActive); err != nil {
				continue
			}
			_ = json.Unmarshal(skills, &c.Skills)
			if c.Skills == nil {
				c.Skills = []string{}
			}
			list = append(list, c)
		}
		respondJSON(w, http.StatusOK, map[string]any{"challenges": list})
	}
}

func handleCreateChallenge(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Slug             string   `json:"slug"`
			Title            string   `json:"title"`
			Description      string   `json:"description"`
			Prompt           string   `json:"prompt"`
			Skills           []string `json:"skills"`
			TimeLimitMinutes int      `json:"time_limit_minutes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Slug) == "" {
			respondError(w, http.StatusBadRequest, "slug and title are required")
			return
		}
		if req.TimeLimitMinutes <= 0 {
			req.TimeLimitMinutes = 120
		}
		if req.Skills == nil {
			req.Skills = []string{}
		}
		skills, _ := json.Marshal(req.Skills)
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO talent.assessment_challenges (slug, title, description, prompt, skills, time_limit_minutes)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
		`, req.Slug, req.Title, req.Description, req.Prompt, skills, req.TimeLimitMinutes).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create challenge (slug may already exist)")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id})
	}
}

func handleAssignChallenge(pool *pgxpool.Pool, emailSender domain.EmailSender) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		appID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(appID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid application id")
			return
		}
		var req struct {
			ChallengeID string `json:"challenge_id"`
			DueInDays   int    `json:"due_in_days"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if _, err := uuid.Parse(req.ChallengeID); err != nil {
			respondError(w, http.StatusBadRequest, "valid challenge_id is required")
			return
		}
		token := randomToken()
		var due any
		if req.DueInDays > 0 {
			due = fmt.Sprintf("%d days", req.DueInDays)
		}
		var id string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO talent.assessment_assignments (application_id, challenge_id, access_token, due_at)
			VALUES ($1, $2, $3, CASE WHEN $4::text IS NULL THEN NULL ELSE NOW() + $4::interval END)
			RETURNING id
		`, appID, req.ChallengeID, token, due).Scan(&id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to assign challenge")
			return
		}
		// Notify the candidate with their challenge link.
		var name, email, title string
		_ = pool.QueryRow(r.Context(), `
			SELECT a.applicant_name, a.applicant_email, c.title
			FROM talent.applications a, talent.assessment_challenges c
			WHERE a.id = $1 AND c.id = $2
		`, appID, req.ChallengeID).Scan(&name, &email, &title)
		if emailSender != nil && email != "" {
			link := baseURL() + "/careers/assessment/" + token
			body := fmt.Sprintf("Hi %s,\n\nYou've been invited to complete a technical assessment: %s.\n\nStart here: %s\n\n— XCreativs Talent", name, title, link)
			go func() {
				_ = emailSender.Send(context.Background(), email, "Technical assessment: "+title, "<p>"+strings.ReplaceAll(body, "\n", "<br>")+"</p>", body)
			}()
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": id, "access_token": token})
	}
}

func handleListAssignments(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		appID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(appID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid application id")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT a.id, c.title, a.status, a.access_token, COALESCE(a.submission_url,'') , COALESCE(a.submission_notes,''),
			       a.score, COALESCE(a.reviewer_notes,''), a.due_at::text, a.assigned_at::text, a.submitted_at::text
			FROM talent.assessment_assignments a JOIN talent.assessment_challenges c ON a.challenge_id = c.id
			WHERE a.application_id = $1 ORDER BY a.assigned_at DESC
		`, appID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list assignments")
			return
		}
		defer rows.Close()
		type asg struct {
			ID              string  `json:"id"`
			ChallengeTitle  string  `json:"challenge_title"`
			Status          string  `json:"status"`
			AccessURL       string  `json:"access_url"`
			SubmissionURL   string  `json:"submission_url"`
			SubmissionNotes string  `json:"submission_notes"`
			Score           *int    `json:"score"`
			ReviewerNotes   string  `json:"reviewer_notes"`
			DueAt           *string `json:"due_at"`
			AssignedAt      string  `json:"assigned_at"`
			SubmittedAt     *string `json:"submitted_at"`
		}
		list := []asg{}
		for rows.Next() {
			var a asg
			var token string
			if err := rows.Scan(&a.ID, &a.ChallengeTitle, &a.Status, &token, &a.SubmissionURL, &a.SubmissionNotes, &a.Score, &a.ReviewerNotes, &a.DueAt, &a.AssignedAt, &a.SubmittedAt); err != nil {
				continue
			}
			a.AccessURL = baseURL() + "/careers/assessment/" + token
			list = append(list, a)
		}
		respondJSON(w, http.StatusOK, map[string]any{"application_id": appID, "assignments": list})
	}
}

func handleReviewAssignment(pool *pgxpool.Pool) http.HandlerFunc {
	valid := map[string]bool{"assigned": true, "submitted": true, "reviewed": true}
	return func(w http.ResponseWriter, r *http.Request) {
		aid := chi.URLParam(r, "aid")
		if _, err := uuid.Parse(aid); err != nil {
			respondError(w, http.StatusBadRequest, "invalid assignment id")
			return
		}
		var req struct {
			Status        string `json:"status"`
			Score         *int   `json:"score"`
			ReviewerNotes string `json:"reviewer_notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Status != "" && !valid[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE talent.assessment_assignments
			SET status = COALESCE(NULLIF($1,''), status), score = COALESCE($2, score),
			    reviewer_notes = $3, updated_at = NOW()
			WHERE id = $4
		`, req.Status, req.Score, req.ReviewerNotes, aid)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update assignment")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "assignment not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

// --- Candidate (token-gated, public) ---

func handleGetCandidateChallenge(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := chi.URLParam(r, "token")
		var out struct {
			Title            string   `json:"title"`
			Description      string   `json:"description"`
			Prompt           string   `json:"prompt"`
			Skills           []string `json:"skills"`
			TimeLimitMinutes int      `json:"time_limit_minutes"`
			Status           string   `json:"status"`
			DueAt            *string  `json:"due_at"`
			ApplicantName    string   `json:"applicant_name"`
		}
		var skills []byte
		err := pool.QueryRow(r.Context(), `
			SELECT c.title, c.description, c.prompt, c.skills, c.time_limit_minutes, a.status, a.due_at::text, app.applicant_name
			FROM talent.assessment_assignments a
			JOIN talent.assessment_challenges c ON a.challenge_id = c.id
			JOIN talent.applications app ON a.application_id = app.id
			WHERE a.access_token = $1
		`, token).Scan(&out.Title, &out.Description, &out.Prompt, &skills, &out.TimeLimitMinutes, &out.Status, &out.DueAt, &out.ApplicantName)
		if err != nil {
			respondError(w, http.StatusNotFound, "assessment not found")
			return
		}
		_ = json.Unmarshal(skills, &out.Skills)
		if out.Skills == nil {
			out.Skills = []string{}
		}
		respondJSON(w, http.StatusOK, out)
	}
}

func handleSubmitCandidateChallenge(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := chi.URLParam(r, "token")
		var req struct {
			SubmissionURL   string `json:"submission_url"`
			SubmissionNotes string `json:"submission_notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.SubmissionURL) == "" && strings.TrimSpace(req.SubmissionNotes) == "" {
			respondError(w, http.StatusBadRequest, "a submission URL or notes are required")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE talent.assessment_assignments
			SET submission_url = $1, submission_notes = $2, status = 'submitted', submitted_at = NOW(), updated_at = NOW()
			WHERE access_token = $3 AND status <> 'reviewed'
		`, req.SubmissionURL, req.SubmissionNotes, token)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to submit")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "assessment not found or already reviewed")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "submitted"})
	}
}
