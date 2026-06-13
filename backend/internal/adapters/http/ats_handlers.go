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

// Applicant Tracking System (agent_plan.md §4.4): admin applicant review,
// status state machine with automated email transitions, and interview
// scheduling. Self-contained: direct pool access.

var applicationStatuses = map[string]bool{
	"received": true, "under_review": true, "interview_scheduled": true,
	"offer": true, "declined": true, "withdrawn": true,
}

// applicationStatusEmail returns the subject/body for a status-transition email,
// or ok=false if no email should be sent for that status.
func applicationStatusEmail(name, roleTitle, status, note string) (subject, html, text string, ok bool) {
	role := roleTitle
	if role == "" {
		role = "the role"
	}
	switch status {
	case "under_review":
		subject = "Your application is under review"
		text = fmt.Sprintf("Hi %s,\n\nYour application for %s is now under review by our team. We'll be in touch with next steps.\n\n— XCreativs Talent", name, role)
	case "interview_scheduled":
		subject = "Interview stage — your XCreativs application"
		text = fmt.Sprintf("Hi %s,\n\nGood news — your application for %s has advanced to the interview stage. We'll follow up with scheduling details.\n\n— XCreativs Talent", name, role)
	case "offer":
		subject = "An update on your XCreativs application"
		text = fmt.Sprintf("Hi %s,\n\nWe'd like to move forward with you for %s. Someone from our team will reach out shortly.\n\n— XCreativs Talent", name, role)
	case "declined":
		subject = "Update on your XCreativs application"
		text = fmt.Sprintf("Hi %s,\n\nThank you for your interest in %s. After careful review we won't be moving forward at this time, but we appreciate the time you invested.\n\n— XCreativs Talent", name, role)
	default:
		return "", "", "", false
	}
	if note != "" {
		text += "\n\nNote: " + note
	}
	html = "<p>" + strings.ReplaceAll(text, "\n", "<br>") + "</p>"
	return subject, html, text, true
}

func handleListApplicationsAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		rows, err := pool.Query(r.Context(), `
			SELECT a.id, a.applicant_name, a.applicant_email, COALESCE(a.applicant_phone,'') AS applicant_phone,
			       COALESCE(a.resume_url,'') AS resume_url, COALESCE(a.portfolio_url,'') AS portfolio_url,
			       COALESCE(a.linkedin_url,'') AS linkedin_url, a.status::text, COALESCE(a.notes,'') AS notes,
			       COALESCE(jr.title,'') AS role_title, COALESCE(jr.slug,'') AS role_slug, a.created_at::text,
			       (SELECT count(*) FROM talent.interviews i WHERE i.application_id = a.id) AS interview_count
			FROM talent.applications a
			LEFT JOIN talent.job_roles jr ON a.role_id = jr.id
			WHERE ($1 = '' OR a.status::text = $1)
			ORDER BY a.created_at DESC
		`, status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list applications")
			return
		}
		defer rows.Close()
		type appRow struct {
			ID             string `json:"id"`
			ApplicantName  string `json:"applicant_name"`
			ApplicantEmail string `json:"applicant_email"`
			ApplicantPhone string `json:"applicant_phone"`
			ResumeURL      string `json:"resume_url"`
			PortfolioURL   string `json:"portfolio_url"`
			LinkedInURL    string `json:"linkedin_url"`
			Status         string `json:"status"`
			Notes          string `json:"notes"`
			RoleTitle      string `json:"role_title"`
			RoleSlug       string `json:"role_slug"`
			CreatedAt      string `json:"created_at"`
			InterviewCount int    `json:"interview_count"`
		}
		list := []appRow{}
		for rows.Next() {
			var a appRow
			if err := rows.Scan(&a.ID, &a.ApplicantName, &a.ApplicantEmail, &a.ApplicantPhone, &a.ResumeURL, &a.PortfolioURL,
				&a.LinkedInURL, &a.Status, &a.Notes, &a.RoleTitle, &a.RoleSlug, &a.CreatedAt, &a.InterviewCount); err != nil {
				continue
			}
			list = append(list, a)
		}
		respondJSON(w, http.StatusOK, map[string]any{"applications": list})
	}
}

func handleUpdateApplicationStatus(pool *pgxpool.Pool, emailSender domain.EmailSender) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid application id")
			return
		}
		var req struct {
			Status string `json:"status"`
			Note   string `json:"note"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if !applicationStatuses[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		var name, email, roleTitle string
		err := pool.QueryRow(r.Context(), `
			UPDATE talent.applications a SET status = $1,
			    notes = CASE WHEN $2 <> '' THEN $2 ELSE a.notes END, updated_at = NOW()
			FROM (SELECT a2.id, a2.applicant_name, a2.applicant_email, COALESCE(jr.title,'') AS rt
			      FROM talent.applications a2 LEFT JOIN talent.job_roles jr ON a2.role_id = jr.id WHERE a2.id = $3) src
			WHERE a.id = $3
			RETURNING src.applicant_name, src.applicant_email, src.rt
		`, req.Status, req.Note, id).Scan(&name, &email, &roleTitle)
		if err != nil {
			respondError(w, http.StatusNotFound, "application not found")
			return
		}
		if emailSender != nil && email != "" {
			if subject, html, text, ok := applicationStatusEmail(name, roleTitle, req.Status, req.Note); ok {
				go func() {
					_ = emailSender.Send(context.Background(), email, subject, html, text)
				}()
			}
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": req.Status})
	}
}

func handleListInterviews(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		appID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(appID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid application id")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT id, application_id, interview_type, scheduled_at::text, duration_minutes, location, interviewer_names, status, feedback
			FROM talent.interviews WHERE application_id = $1 ORDER BY scheduled_at ASC
		`, appID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list interviews")
			return
		}
		defer rows.Close()
		type iv struct {
			ID               string   `json:"id"`
			ApplicationID    string   `json:"application_id"`
			InterviewType    string   `json:"interview_type"`
			ScheduledAt      string   `json:"scheduled_at"`
			DurationMinutes  int      `json:"duration_minutes"`
			Location         string   `json:"location"`
			InterviewerNames []string `json:"interviewer_names"`
			Status           string   `json:"status"`
			Feedback         string   `json:"feedback"`
		}
		list := []iv{}
		for rows.Next() {
			var i iv
			var names []byte
			var ts string
			if err := rows.Scan(&i.ID, &i.ApplicationID, &i.InterviewType, &ts, &i.DurationMinutes, &i.Location, &names, &i.Status, &i.Feedback); err != nil {
				continue
			}
			i.ScheduledAt = ts
			_ = json.Unmarshal(names, &i.InterviewerNames)
			list = append(list, i)
		}
		respondJSON(w, http.StatusOK, map[string]any{"application_id": appID, "interviews": list})
	}
}

func handleScheduleInterview(pool *pgxpool.Pool, emailSender domain.EmailSender) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		appID := chi.URLParam(r, "id")
		if _, err := uuid.Parse(appID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid application id")
			return
		}
		var req struct {
			InterviewType    string   `json:"interview_type"`
			ScheduledAt      string   `json:"scheduled_at"`
			DurationMinutes  int      `json:"duration_minutes"`
			Location         string   `json:"location"`
			InterviewerNames []string `json:"interviewer_names"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if strings.TrimSpace(req.ScheduledAt) == "" {
			respondError(w, http.StatusBadRequest, "scheduled_at is required")
			return
		}
		if req.InterviewType == "" {
			req.InterviewType = "phone"
		}
		if req.DurationMinutes <= 0 {
			req.DurationMinutes = 45
		}
		if req.InterviewerNames == nil {
			req.InterviewerNames = []string{}
		}
		names, _ := json.Marshal(req.InterviewerNames)
		var ivID string
		err := pool.QueryRow(r.Context(), `
			INSERT INTO talent.interviews (application_id, interview_type, scheduled_at, duration_minutes, location, interviewer_names)
			VALUES ($1, $2, $3::timestamptz, $4, $5, $6) RETURNING id
		`, appID, req.InterviewType, req.ScheduledAt, req.DurationMinutes, req.Location, names).Scan(&ivID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to schedule interview")
			return
		}
		// Advance the application into the interview stage and notify the applicant.
		var name, email, roleTitle string
		_ = pool.QueryRow(r.Context(), `
			UPDATE talent.applications a SET status = 'interview_scheduled', updated_at = NOW()
			FROM (SELECT a2.id, a2.applicant_name, a2.applicant_email, COALESCE(jr.title,'') AS rt
			      FROM talent.applications a2 LEFT JOIN talent.job_roles jr ON a2.role_id = jr.id WHERE a2.id = $1) src
			WHERE a.id = $1 RETURNING src.applicant_name, src.applicant_email, src.rt
		`, appID).Scan(&name, &email, &roleTitle)
		if emailSender != nil && email != "" {
			if subject, html, text, ok := applicationStatusEmail(name, roleTitle, "interview_scheduled", ""); ok {
				go func() { _ = emailSender.Send(context.Background(), email, subject, html, text) }()
			}
		}
		respondJSON(w, http.StatusCreated, map[string]any{"id": ivID, "status": "scheduled"})
	}
}

func handleUpdateInterview(pool *pgxpool.Pool) http.HandlerFunc {
	validStatus := map[string]bool{"scheduled": true, "completed": true, "cancelled": true, "no_show": true}
	return func(w http.ResponseWriter, r *http.Request) {
		ivID := chi.URLParam(r, "iid")
		if _, err := uuid.Parse(ivID); err != nil {
			respondError(w, http.StatusBadRequest, "invalid interview id")
			return
		}
		var req struct {
			Status   string `json:"status"`
			Feedback string `json:"feedback"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Status != "" && !validStatus[req.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE talent.interviews
			SET status = COALESCE(NULLIF($1,''), status), feedback = $2, updated_at = NOW()
			WHERE id = $3
		`, req.Status, req.Feedback, ivID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update interview")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "interview not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}
