package http

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func handleExportBookings(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, email, topic, first_name, last_name, organization, preferred_date, status, created_at
			FROM lead_qual.consultation_bookings
			ORDER BY created_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to export bookings")
			return
		}
		defer rows.Close()

		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=bookings_%s.csv", time.Now().Format("2006-01-02")))

		writer := csv.NewWriter(w)
		_ = writer.Write([]string{"ID", "Email", "Topic", "First Name", "Last Name", "Organization", "Preferred Date", "Status", "Created At"})

		for rows.Next() {
			var id, email, topic, firstName, lastName, org, status string
			var preferredDate interface{}
			var createdAt time.Time
			if err := rows.Scan(&id, &email, &topic, &firstName, &lastName, &org, &preferredDate, &status, &createdAt); err == nil {
				prefDate := ""
				if preferredDate != nil {
					prefDate = fmt.Sprintf("%v", preferredDate)
				}
				_ = writer.Write([]string{id, email, topic, firstName, lastName, org, prefDate, status, createdAt.Format(time.RFC3339)})
			}
		}
		writer.Flush()
	}
}

func handleExportRFPs(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, organization, contact_name, contact_email, scope_summary, status, created_at
			FROM lead_qual.rfp_submissions
			ORDER BY created_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to export rfps")
			return
		}
		defer rows.Close()

		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=rfps_%s.csv", time.Now().Format("2006-01-02")))

		writer := csv.NewWriter(w)
		_ = writer.Write([]string{"ID", "Organization", "Contact Name", "Contact Email", "Scope Summary", "Status", "Created At"})

		for rows.Next() {
			var id, org, contactName, contactEmail, scope, status string
			var createdAt time.Time
			if err := rows.Scan(&id, &org, &contactName, &contactEmail, &scope, &status, &createdAt); err == nil {
				_ = writer.Write([]string{id, org, contactName, contactEmail, scope, status, createdAt.Format(time.RFC3339)})
			}
		}
		writer.Flush()
	}
}

func handleExportDiagnostics(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, email, prospect_name, organization, sector, status, created_at
			FROM lead_qual.diagnostics
			ORDER BY created_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to export diagnostics")
			return
		}
		defer rows.Close()

		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=diagnostics_%s.csv", time.Now().Format("2006-01-02")))

		writer := csv.NewWriter(w)
		_ = writer.Write([]string{"ID", "Email", "Prospect Name", "Organization", "Sector", "Status", "Created At"})

		for rows.Next() {
			var id, email, prospectName, org, sector, status string
			var createdAt time.Time
			if err := rows.Scan(&id, &email, &prospectName, &org, &sector, &status, &createdAt); err == nil {
				_ = writer.Write([]string{id, email, prospectName, org, sector, status, createdAt.Format(time.RFC3339)})
			}
		}
		writer.Flush()
	}
}
