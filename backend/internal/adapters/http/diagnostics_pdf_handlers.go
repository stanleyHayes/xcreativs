package http

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/pkg/pdf"
)

// routingLabel maps the diagnostic_routing enum to a human-readable recommendation.
func routingLabel(routing string) string {
	switch routing {
	case "services":
		return "Recommended path: a scoped Services engagement (audit, build, or transformation)."
	case "labs_collaboration":
		return "Recommended path: a Labs collaboration to co-develop a product."
	case "government_digital_excellence":
		return "Recommended path: the Government Digital Excellence programme."
	case "decline_with_referral":
		return "Recommended path: not a current fit — see the named alternatives and resources we shared."
	default:
		return "Recommended path: pending — complete the diagnostic to receive a routing recommendation."
	}
}

// handleDiagnosticSummaryPDF renders a one-page PDF summary of a diagnostic
// (agent_plan.md §3.5: "generates PDF summary"). Pure-Go, no external library.
func handleDiagnosticSummaryPDF(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		d, err := deps.Lead.GetDiagnostic(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "diagnostic not found")
			return
		}

		who := d.ProspectName
		if who == "" {
			who = d.Email
		}

		lines := []pdf.Line{
			{Text: "XCreativs Technologies", Size: 10, Bold: false},
			{Text: fmt.Sprintf("Prepared for: %s", who), Bold: true, Gap: 6},
		}
		if d.Organization != "" {
			lines = append(lines, pdf.Line{Text: fmt.Sprintf("Organisation: %s", d.Organization)})
		}
		if d.Sector != "" {
			lines = append(lines, pdf.Line{Text: fmt.Sprintf("Sector: %s", d.Sector)})
		}
		lines = append(lines,
			pdf.Line{Text: fmt.Sprintf("Date: %s", d.CreatedAt.Format("2 January 2006"))},
			pdf.Line{Text: fmt.Sprintf("Status: %s", d.Status)},
			pdf.Line{Text: "Assessment", Bold: true, Size: 13, Gap: 14},
			pdf.Line{Text: routingLabel(d.Routing), Gap: 4},
		)
		if d.IndicativeScope != "" {
			lines = append(lines,
				pdf.Line{Text: "Indicative scope", Bold: true, Gap: 12},
				pdf.Line{Text: d.IndicativeScope, Gap: 2},
			)
		}
		if d.IndicativeNextSteps != "" {
			lines = append(lines,
				pdf.Line{Text: "Recommended next steps", Bold: true, Gap: 12},
				pdf.Line{Text: d.IndicativeNextSteps, Gap: 2},
			)
		}
		lines = append(lines,
			pdf.Line{Text: fmt.Sprintf("Responses captured: %d", len(d.Answers)), Gap: 14},
			pdf.Line{Text: "This summary is indicative and not a contractual commitment.", Size: 9, Gap: 18},
		)

		doc := pdf.Document{Title: "Engagement Readiness Diagnostic", Lines: lines}
		out := doc.Render()

		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="diagnostic-%s.pdf"`, id))
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Generated-At", time.Now().UTC().Format(time.RFC3339))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(out)
	}
}
