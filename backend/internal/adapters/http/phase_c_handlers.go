package http

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Phase C interactive-tool data endpoints + audit-log export (agent_plan.md §5.2, §5.4).

// handleValueFlow returns the Services → Labs → Subsidiaries value-loop with live
// metrics for the Value Flow animation.
func handleValueFlow(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var services, labs, subs, activeEng, deliverables, decisions int
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM content.services WHERE status='published'`).Scan(&services)
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM content.labs_products WHERE status='published'`).Scan(&labs)
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM content.subsidiaries WHERE status='active'`).Scan(&subs)
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM engagement.engagements WHERE stage IN ('active','proposal')`).Scan(&activeEng)
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM engagement.deliverables`).Scan(&deliverables)
		_ = pool.QueryRow(r.Context(), `SELECT count(*) FROM engagement.decisions`).Scan(&decisions)
		respondJSON(w, http.StatusOK, map[string]any{
			"nodes": []map[string]any{
				{"id": "clients", "label": "Client Revenue", "metric": activeEng, "metric_label": "active engagements", "stage": 1},
				{"id": "services", "label": "Services", "metric": services, "metric_label": "service lines", "stage": 1},
				{"id": "labs", "label": "Labs (IP creation)", "metric": labs, "metric_label": "products", "stage": 2},
				{"id": "subsidiaries", "label": "Subsidiaries", "metric": subs, "metric_label": "spun out", "stage": 3},
			},
			"flows": []map[string]any{
				{"from": "clients", "to": "services", "label": "fund operations"},
				{"from": "services", "to": "labs", "label": "reinvest into IP"},
				{"from": "labs", "to": "subsidiaries", "label": "spin out"},
				{"from": "subsidiaries", "to": "clients", "label": "compound reach"},
			},
			"totals": map[string]any{"deliverables_shipped": deliverables, "decisions_logged": decisions},
		})
	}
}

// handleCapabilityLatticeExplorer returns the sector × capability grid derived
// from real content: an intersection is "deep"/"proven" where published case
// dossiers exist for that industry + service line.
func handleCapabilityLatticeExplorer(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT i.sector::text, i.title, s.service_line::text, s.title,
			       count(cd.id) AS n, COALESCE(max(cd.title), '') AS precedent
			FROM content.industries i
			CROSS JOIN content.services s
			LEFT JOIN content.case_dossiers cd
			  ON cd.industry::text = i.sector::text AND cd.service_line::text = s.service_line::text AND cd.status = 'published'
			WHERE i.status = 'published' AND s.status = 'published'
			GROUP BY i.sector, i.title, s.service_line, s.title
			ORDER BY i.title, s.title
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to build lattice")
			return
		}
		defer rows.Close()
		type cell struct {
			Sector     string `json:"sector"`
			Capability string `json:"capability"`
			Depth      string `json:"depth"`
			Precedent  string `json:"precedent"`
			Count      int    `json:"count"`
		}
		sectorsSet := map[string]bool{}
		capsSet := map[string]bool{}
		var sectors, caps []string
		var cells []cell
		for rows.Next() {
			var sKey, sTitle, cKey, cTitle, prec string
			var n int
			if err := rows.Scan(&sKey, &sTitle, &cKey, &cTitle, &n, &prec); err != nil {
				continue
			}
			if !sectorsSet[sTitle] {
				sectorsSet[sTitle] = true
				sectors = append(sectors, sTitle)
			}
			if !capsSet[cTitle] {
				capsSet[cTitle] = true
				caps = append(caps, cTitle)
			}
			depth := "available"
			if n >= 2 {
				depth = "deep"
			} else if n == 1 {
				depth = "proven"
			}
			cells = append(cells, cell{Sector: sTitle, Capability: cTitle, Depth: depth, Precedent: prec, Count: n})
		}
		respondJSON(w, http.StatusOK, map[string]any{"sectors": sectors, "capabilities": caps, "cells": cells})
	}
}

func captureToolLead(pool *pgxpool.Pool, eventType, visitor, email string, meta map[string]any) {
	if visitor == "" {
		visitor = email
	}
	if visitor == "" {
		visitor = "anonymous"
	}
	_, _ = pool.Exec(context.Background(), `
		INSERT INTO identity.analytics_events (event_type, visitor_id, page_path, metadata)
		VALUES ($1, $2, $3, $4)
	`, eventType, visitor, "/tools", meta)
}

// handleTechDebtEstimate computes an indicative tech-debt rating server-side and
// captures the lead.
func handleTechDebtEstimate(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			SystemAgeYears  float64 `json:"system_age_years"`
			TechCount       int     `json:"tech_count"`
			IntegrationCount int    `json:"integration_count"`
			ChangeFrequency string  `json:"change_frequency"` // low | medium | high
			Email           string  `json:"email"`
			VisitorID       string  `json:"visitor_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		score := req.SystemAgeYears*6 + float64(req.TechCount)*3 + float64(req.IntegrationCount)*2.5
		switch req.ChangeFrequency {
		case "high":
			score += 20
		case "medium":
			score += 10
		}
		if score > 100 {
			score = 100
		}
		rating := "Low"
		switch {
		case score >= 70:
			rating = "Critical"
		case score >= 45:
			rating = "High"
		case score >= 25:
			rating = "Moderate"
		}
		recs := map[string]string{
			"Low":      "Healthy posture. Keep dependencies current and document architecture decisions.",
			"Moderate": "Schedule a focused remediation sprint on the highest-churn integrations.",
			"High":     "Commission a Digital Systems Audit to sequence a 12–18 month modernisation.",
			"Critical": "Material risk to delivery. Engage for an architecture review before the next major change.",
		}
		captureToolLead(pool, "tech_debt_estimate", req.VisitorID, req.Email, map[string]any{
			"email": req.Email, "score": int(score), "rating": rating,
		})
		respondJSON(w, http.StatusOK, map[string]any{"score": int(score), "rating": rating, "recommendation": recs[rating]})
	}
}

// handleCostEstimate returns an indicative weeks + price band for a scope, and
// captures the lead.
func handleCostEstimate(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Complexity  string `json:"complexity"`  // low | medium | high
			Urgency     string `json:"urgency"`     // standard | expedited
			TeamSize    int    `json:"team_size"`
			Sovereignty bool   `json:"sovereignty"`
			Email       string `json:"email"`
			VisitorID   string `json:"visitor_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		base := 6.0
		switch req.Complexity {
		case "medium":
			base = 12
		case "high":
			base = 24
		}
		if req.TeamSize > 0 {
			base += float64(req.TeamSize) * 1.5
		}
		mult := 1.0
		if req.Urgency == "expedited" {
			mult = 1.35
		}
		if req.Sovereignty {
			mult += 0.15
		}
		weeksLow := int(base * mult)
		weeksHigh := int(base*mult*1.5) + 2
		priceLow := weeksLow * 4000
		priceHigh := weeksHigh * 6500
		captureToolLead(pool, "cost_estimate", req.VisitorID, req.Email, map[string]any{
			"email": req.Email, "complexity": req.Complexity, "price_low_usd": priceLow, "price_high_usd": priceHigh,
		})
		respondJSON(w, http.StatusOK, map[string]any{
			"weeks_band":     fmt.Sprintf("%d–%d weeks", weeksLow, weeksHigh),
			"price_band_usd": fmt.Sprintf("$%s–$%s", commaInt(priceLow), commaInt(priceHigh)),
		})
	}
}

func commaInt(n int) string {
	s := fmt.Sprintf("%d", n)
	var out []byte
	for i, c := range []byte(s) {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, c)
	}
	return string(out)
}

// handleAuditLogExport returns the authenticated user's audit trail as JSON or
// CSV (agent_plan.md §5.4: read-only client data export).
func handleAuditLogExport(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, _ := r.Context().Value(userIDKey).(string)
		if uid == "" {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		rows, err := pool.Query(r.Context(), `
			SELECT created_at::text, action, resource, COALESCE(resource_id::text,''), COALESCE(ip_address::text,'')
			FROM identity.audit_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000
		`, uid)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to load audit log")
			return
		}
		defer rows.Close()
		type entry struct {
			Time     string `json:"time"`
			Action   string `json:"action"`
			Resource string `json:"resource"`
			ResID    string `json:"resource_id"`
			IP       string `json:"ip_address"`
		}
		var entries []entry
		for rows.Next() {
			var e entry
			if rows.Scan(&e.Time, &e.Action, &e.Resource, &e.ResID, &e.IP) == nil {
				entries = append(entries, e)
			}
		}
		if strings.EqualFold(r.URL.Query().Get("format"), "csv") {
			w.Header().Set("Content-Type", "text/csv; charset=utf-8")
			w.Header().Set("Content-Disposition", `attachment; filename="audit-log.csv"`)
			cw := csv.NewWriter(w)
			_ = cw.Write([]string{"time", "action", "resource", "resource_id", "ip_address"})
			for _, e := range entries {
				_ = cw.Write([]string{e.Time, e.Action, e.Resource, e.ResID, e.IP})
			}
			cw.Flush()
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"entries": entries})
	}
}
