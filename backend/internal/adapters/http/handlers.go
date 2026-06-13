package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/mail"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/adapters/db"
	"xcreatives.com/backend/internal/domain"
	"xcreatives.com/backend/pkg/email"
)

// HandlerDependencies holds repository dependencies.
type HandlerDependencies struct {
	Content      domain.ContentRepository
	Lead         domain.LeadRepository
	Talent       domain.TalentRepository
	Engagement   domain.EngagementRepository
	Partner      domain.PartnerRepository
	Concierge    domain.ConciergeRepository
	Assessment   domain.AssessmentRepository
	PortalConfig domain.PortalConfigRepository
	Signature    domain.SignatureRepository
}

// NewHandlerDependencies creates repositories from the DB pool.
func NewHandlerDependencies(pool *pgxpool.Pool) *HandlerDependencies {
	return &HandlerDependencies{
		Content:      db.NewContentRepo(pool),
		Lead:         db.NewLeadRepo(pool),
		Talent:       db.NewTalentRepo(pool),
		Engagement:   db.NewEngagementRepo(pool),
		Partner:      db.NewPartnerRepo(pool),
		Concierge:    db.NewInteractiveRepo(pool),
		Assessment:   db.NewInteractiveRepo(pool),
		PortalConfig: db.NewPortalConfigRepo(pool),
		Signature:    db.NewSignatureRepo(pool),
	}
}

// --- Public Pages ---

func handleHomePage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		page, err := deps.Content.GetPageBySlug(r.Context(), "home")
		if err != nil {
			respondError(w, http.StatusNotFound, "home page not found")
			return
		}
		ticker, _ := deps.Content.GetLiveTicker(r.Context())
		services, _ := deps.Content.ListServices(r.Context())
		labs, _ := deps.Content.ListLabsProducts(r.Context())
		dossiers, _ := deps.Content.ListCaseDossiers(r.Context(), map[string]string{})
		// Limit dossiers to 5
		if len(dossiers) > 5 {
			dossiers = dossiers[:5]
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"page":     page,
			"ticker":   ticker,
			"services": services,
			"labs":     labs,
			"dossiers": dossiers,
		})
	}
}

func handleAboutPage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		page, err := deps.Content.GetPageBySlug(r.Context(), "about")
		if err != nil {
			respondError(w, http.StatusNotFound, "about page not found")
			return
		}
		respondJSON(w, http.StatusOK, page)
	}
}

// --- Services ---

func handleListServices(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		services, err := deps.Content.ListServices(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list services")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"services": services})
	}
}

func handleGetService(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		service, err := deps.Content.GetServiceBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "service not found")
			return
		}
		respondJSON(w, http.StatusOK, service)
	}
}

// --- Labs ---

func handleListLabs(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		products, err := deps.Content.ListLabsProducts(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list labs")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"products": products})
	}
}

func handleGetLabProduct(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		product, err := deps.Content.GetLabsProductBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "product not found")
			return
		}
		respondJSON(w, http.StatusOK, product)
	}
}

// --- Work / Case Dossiers ---

func handleListWork(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		filters := map[string]string{
			"industry":     r.URL.Query().Get("industry"),
			"service_line": r.URL.Query().Get("service_line"),
		}
		dossiers, err := deps.Content.ListCaseDossiers(r.Context(), filters)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list dossiers")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"dossiers": dossiers})
	}
}

func handleGetWork(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		dossier, err := deps.Content.GetCaseDossierBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "dossier not found")
			return
		}
		respondJSON(w, http.StatusOK, dossier)
	}
}

// --- Industries ---

func handleListIndustries(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		industries, err := deps.Content.ListIndustries(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list industries")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"industries": industries})
	}
}

func handleGetIndustry(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		industry, err := deps.Content.GetIndustryBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "industry not found")
			return
		}
		respondJSON(w, http.StatusOK, industry)
	}
}

// --- Insights ---

func handleListInsights(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		contentType := r.URL.Query().Get("type")
		lang := r.URL.Query().Get("lang")
		if lang == "" {
			lang = "en"
		}
		insights, err := deps.Content.ListInsights(r.Context(), contentType, lang)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list insights")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"insights": insights})
	}
}

func handleGetInsight(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		insight, err := deps.Content.GetInsightBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "insight not found")
			return
		}
		// Do not leak the gated download URL on the public detail endpoint; it is
		// only returned via POST /insights/{slug}/download after email capture.
		if insight.IsGated {
			insight.GatedPDFURL = ""
		}
		respondJSON(w, http.StatusOK, insight)
	}
}

// --- Glossary, FAQ, Press ---

func handleListGlossary(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		terms, err := deps.Content.ListGlossary(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list glossary")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"terms": terms})
	}
}

func handleListFAQ(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		faqs, err := deps.Content.ListFAQ(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list faq")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"faqs": faqs})
	}
}

func handleListPress(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		press, err := deps.Content.ListPressReleases(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list press")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"press": press})
	}
}

func handleListMediaKit(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		assets, err := deps.Content.ListMediaKit(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list media kit")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"assets": assets})
	}
}

func handleTrackEvent(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			EventType string         `json:"event_type"`
			VisitorID string         `json:"visitor_id"`
			PagePath  string         `json:"page_path"`
			SessionID string         `json:"session_id"`
			Referrer  string         `json:"referrer"`
			Metadata  map[string]any `json:"metadata"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.EventType == "" || req.VisitorID == "" {
			respondError(w, http.StatusBadRequest, "event_type and visitor_id required")
			return
		}

		var userID *string
		if uid, ok := r.Context().Value(userIDKey).(string); ok && uid != "" {
			userID = &uid
		}

		meta := req.Metadata
		if meta == nil {
			meta = map[string]any{}
		}
		if req.SessionID != "" {
			meta["session_id"] = req.SessionID
		}
		if req.Referrer != "" {
			meta["referrer"] = req.Referrer
		}
		meta["user_agent"] = r.UserAgent()
		meta["ip_address"] = r.RemoteAddr

		_, err := pool.Exec(r.Context(), `
			INSERT INTO identity.analytics_events (event_type, visitor_id, user_id, page_path, metadata)
			VALUES ($1, $2, $3, $4, $5)
		`, req.EventType, req.VisitorID, userID, req.PagePath, meta)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to track event")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

// --- Metrics ---

func handleLiveTicker(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		ticker, err := deps.Content.GetLiveTicker(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to get ticker")
			return
		}
		respondJSON(w, http.StatusOK, ticker)
	}
}

// --- Search ---

func handleSearch(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query().Get("q")
		lang := r.URL.Query().Get("lang")
		if q == "" {
			respondJSON(w, http.StatusOK, map[string]any{"results": []domain.SearchResult{}})
			return
		}
		if lang == "" {
			lang = "en"
		}
		results, err := deps.Content.SearchPublic(r.Context(), q, lang)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "search failed")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"results": results})
	}
}

func handlePortalSearch(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query().Get("q")
		if q == "" {
			respondJSON(w, http.StatusOK, map[string]any{"results": []domain.SearchResult{}})
			return
		}
		userID := r.Context().Value(userIDKey).(string)
		publicResults, _ := deps.Content.SearchPublic(r.Context(), q, "en")
		portalResults, _ := deps.Content.SearchPortal(r.Context(), q, userID)
		respondJSON(w, http.StatusOK, map[string]any{
			"public": publicResults,
			"portal": portalResults,
		})
	}
}

// --- Lead Qualification ---

func handleStartDiagnostic(pool *pgxpool.Pool, emailSender domain.EmailSender, baseURL string) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email        string `json:"email"`
			ProspectName string `json:"prospect_name"`
			Organization string `json:"organization"`
			Sector       string `json:"sector"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email == "" {
			respondError(w, http.StatusBadRequest, "email is required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}
		d := &domain.Diagnostic{
			ID:           uuid.New(),
			Email:        req.Email,
			ProspectName: req.ProspectName,
			Organization: req.Organization,
			Sector:       req.Sector,
			Status:       "in_progress",
		}
		if err := deps.Lead.CreateDiagnostic(r.Context(), d); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to start diagnostic")
			return
		}
		go dispatchEvent(r.Context(), pool, "diagnostic_start", "New Diagnostic Started", fmt.Sprintf("%s from %s started a diagnostic.", req.ProspectName, req.Organization), map[string]any{
			"prospect_name": req.ProspectName,
			"organization":  req.Organization,
			"sector":        req.Sector,
			"email":         req.Email,
		})
		// Send confirmation email
		if emailSender != nil {
			go func() {
				name := req.ProspectName
				if name == "" {
					name = req.Email
				}
				subject, htmlBody, textBody := email.DiagnosticConfirmationEmail(email.DiagnosticConfirmationData{
					Name:         name,
					Email:        req.Email,
					Organization: req.Organization,
				})
				_ = emailSender.Send(r.Context(), req.Email, subject, htmlBody, textBody)
			}()
		}
		respondJSON(w, http.StatusCreated, map[string]any{"diagnostic_id": d.ID, "status": d.Status})
	}
}

func handleAnswerDiagnostic(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Answers []any  `json:"answers"`
			Routing string `json:"routing"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if err := deps.Lead.UpdateDiagnosticAnswers(r.Context(), id, req.Answers, req.Routing); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to save answers")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "saved"})
	}
}

func handleDiagnosticResult(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		d, err := deps.Lead.GetDiagnostic(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "diagnostic not found")
			return
		}
		respondJSON(w, http.StatusOK, d)
	}
}

func handleCreateEstimate(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email        string         `json:"email"`
			ProspectName string         `json:"prospect_name"`
			Organization string         `json:"organization"`
			ServiceLine  string         `json:"service_line"`
			Parameters   map[string]any `json:"parameters"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email != "" {
			if _, err := mail.ParseAddress(req.Email); err != nil {
				respondError(w, http.StatusBadRequest, "invalid email")
				return
			}
		}

		normalizedLine, weeks, priceUSD, priceGHS, components, architecture := computeEstimate(req.ServiceLine, req.Parameters)

		e := &domain.ScopeEstimate{
			ID:                 uuid.New(),
			Email:              req.Email,
			ProspectName:       req.ProspectName,
			Organization:       req.Organization,
			ServiceLine:        normalizedLine,
			Parameters:         req.Parameters,
			Components:         components,
			WeeksBand:          weeks,
			PriceBandUSD:       priceUSD,
			PriceBandGHS:       priceGHS,
			SampleArchitecture: architecture,
		}
		if err := deps.Lead.CreateScopeEstimate(r.Context(), e); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create estimate")
			return
		}
		respondJSON(w, http.StatusCreated, e)
	}
}

// computeEstimate calculates scope bands based on service line and complexity parameters.
func computeEstimate(serviceLine string, params map[string]any) (normalizedLine, weeks, priceUSD, priceGHS string, components []any, architecture string) {
	// Base ranges by service line (USD min, USD max, weeks min, weeks max)
	bases := map[string][4]int{
		"digital_systems_audit":         {15000, 35000, 2, 6},
		"strategy_advisory":             {25000, 90000, 4, 12},
		"strategic_web_platforms":       {45000, 150000, 8, 20},
		"ai_automation":                 {60000, 220000, 12, 28},
		"enterprise_government_systems": {80000, 350000, 16, 40},
	}
	normalizedLine = serviceLine
	base := bases[serviceLine]
	if base[0] == 0 {
		normalizedLine = "strategy_advisory"
		base = bases[normalizedLine]
	}

	minUSD, maxUSD, minWeeks, maxWeeks := float64(base[0]), float64(base[1]), base[2], base[3]

	// Complexity multipliers
	integrations := 0
	if v, ok := params["integrations"].(float64); ok {
		integrations = int(v)
	}
	integMult := 1.0
	if integrations >= 10 {
		integMult = 1.6
	} else if integrations >= 4 {
		integMult = 1.3
	} else if integrations >= 1 {
		integMult = 1.1
	}

	dataVolume := "small"
	if v, ok := params["data_volume"].(string); ok {
		dataVolume = v
	}
	dataMult := map[string]float64{"small": 1.0, "medium": 1.1, "large": 1.25, "enterprise": 1.5}[dataVolume]
	if dataMult == 0 {
		dataMult = 1.0
	}

	users := 0
	if v, ok := params["user_count"].(float64); ok {
		users = int(v)
	}
	userMult := 1.0
	if users >= 10000 {
		userMult = 1.5
	} else if users >= 1000 {
		userMult = 1.25
	} else if users >= 100 {
		userMult = 1.1
	}

	compliance := "none"
	if v, ok := params["compliance"].(string); ok {
		compliance = v
	}
	compMult := map[string]float64{"none": 1.0, "standard": 1.1, "regulatory": 1.3, "national_security": 1.6}[compliance]
	if compMult == 0 {
		compMult = 1.0
	}

	aiNeeds := "none"
	if v, ok := params["ai_needs"].(string); ok {
		aiNeeds = v
	}
	aiMult := map[string]float64{"none": 1.0, "basic": 1.15, "advanced": 1.4}[aiNeeds]
	if aiMult == 0 {
		aiMult = 1.0
	}

	urgency := "standard"
	if v, ok := params["timeline_urgency"].(string); ok {
		urgency = v
	}
	urgMult := map[string]float64{"standard": 1.0, "accelerated": 1.15, "critical": 1.35}[urgency]
	if urgMult == 0 {
		urgMult = 1.0
	}

	totalMult := integMult * dataMult * userMult * compMult * aiMult * urgMult
	minUSD = minUSD * totalMult
	maxUSD = maxUSD * totalMult

	// Round to nice numbers
	round := func(n float64) int {
		if n < 10000 {
			return int(n/1000) * 1000
		}
		return int(n/5000) * 5000
	}
	minUSDf, maxUSDf := round(minUSD), round(maxUSD)

	// Weeks scale with complexity but capped
	weekMult := (integMult + dataMult + userMult + compMult + aiMult + urgMult) / 6.0
	minWeeks = int(float64(minWeeks) * weekMult)
	maxWeeks = int(float64(maxWeeks) * weekMult)
	if maxWeeks > 52 {
		maxWeeks = 52
	}

	ghsRate := 15.5
	minGHS, maxGHS := int(float64(minUSDf)*ghsRate), int(float64(maxUSDf)*ghsRate)

	priceUSD = fmt.Sprintf("$%s–$%s", formatNumber(minUSDf), formatNumber(maxUSDf))
	priceGHS = fmt.Sprintf("₵%s–₵%s", formatNumber(minGHS), formatNumber(maxGHS))
	weeks = fmt.Sprintf("%d–%d weeks", minWeeks, maxWeeks)

	// Components breakdown
	components = []any{
		map[string]string{"name": "Discovery & Architecture", "phase": "weeks 1–" + fmt.Sprintf("%d", minWeeks/4)},
		map[string]string{"name": "Design & Prototyping", "phase": "weeks " + fmt.Sprintf("%d–%d", minWeeks/4+1, minWeeks/2)},
		map[string]string{"name": "Development", "phase": "weeks " + fmt.Sprintf("%d–%d", minWeeks/2+1, maxWeeks*3/4)},
		map[string]string{"name": "Testing & Deployment", "phase": "weeks " + fmt.Sprintf("%d–%d", maxWeeks*3/4+1, maxWeeks)},
	}

	// Sample architecture description
	architectures := map[string]string{
		"digital_systems_audit":         "PostgreSQL + Next.js frontend. Containerised on AWS ECS. Read-only data connectors to existing systems.",
		"strategy_advisory":             "Not applicable — advisory engagement. Deliverables: reports, roadmaps, governance frameworks.",
		"strategic_web_platforms":       "Next.js App Router + Go microservices + PostgreSQL. Deployed on AWS ECS with CloudFront CDN.",
		"ai_automation":                 "Python inference services (FastAPI) + vector database (Pinecone/Weaviate) + Next.js frontend. GPU workers on AWS SageMaker.",
		"enterprise_government_systems": "Go backend (Chi) + PostgreSQL + Redis cache + Next.js portal. Multi-tenant with row-level security. Deployed on AWS GovCloud or national cloud.",
	}
	architecture = architectures[serviceLine]
	if architecture == "" {
		architecture = architectures["strategy_advisory"]
	}

	return
}

func formatNumber(n int) string {
	if n >= 1000000 {
		return fmt.Sprintf("%.1fM", float64(n)/1000000)
	}
	if n >= 1000 {
		return fmt.Sprintf("%dk", n/1000)
	}
	return fmt.Sprintf("%d", n)
}

func handleCreateRFP(pool *pgxpool.Pool, emailSender domain.EmailSender, baseURL string) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Organization           string    `json:"organization"`
			ContactName            string    `json:"contact_name"`
			ContactEmail           string    `json:"contact_email"`
			ContactPhone           string    `json:"contact_phone"`
			Deadline               time.Time `json:"deadline"`
			ScopeSummary           string    `json:"scope_summary"`
			EvaluationCriteria     string    `json:"evaluation_criteria"`
			SubmissionRequirements string    `json:"submission_requirements"`
			DocumentURL            string    `json:"document_url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Organization == "" || req.ContactName == "" || req.ContactEmail == "" {
			respondError(w, http.StatusBadRequest, "organization, contact_name, and contact_email are required")
			return
		}
		if _, err := mail.ParseAddress(req.ContactEmail); err != nil {
			respondError(w, http.StatusBadRequest, "invalid contact_email")
			return
		}
		rs := &domain.RFPSubmission{
			ID:                     uuid.New(),
			Organization:           req.Organization,
			ContactName:            req.ContactName,
			ContactEmail:           req.ContactEmail,
			ContactPhone:           req.ContactPhone,
			Deadline:               &req.Deadline,
			ScopeSummary:           req.ScopeSummary,
			EvaluationCriteria:     req.EvaluationCriteria,
			SubmissionRequirements: req.SubmissionRequirements,
			DocumentURL:            strPtr(req.DocumentURL),
			Status:                 "received",
		}
		if err := deps.Lead.CreateRFPSubmission(r.Context(), rs); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to submit rfp")
			return
		}
		go dispatchEvent(r.Context(), pool, "rfp_submit", "New RFP Submitted", fmt.Sprintf("RFP from %s — %s", req.Organization, req.ScopeSummary[:min(len(req.ScopeSummary), 100)]), map[string]any{
			"organization":  req.Organization,
			"scope_summary": req.ScopeSummary,
			"contact_email": req.ContactEmail,
		})
		// Send confirmation email
		if emailSender != nil {
			go func() {
				subject, htmlBody, textBody := email.RFPConfirmationEmail(email.RFPConfirmationData{
					Name:         req.ContactName,
					Email:        req.ContactEmail,
					Organization: req.Organization,
					ScopeSummary: req.ScopeSummary,
				})
				_ = emailSender.Send(r.Context(), req.ContactEmail, subject, htmlBody, textBody)
			}()
		}
		respondJSON(w, http.StatusCreated, map[string]any{"rfp_id": rs.ID, "status": rs.Status})
	}
}

func handleNewsletterSubscribe(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email     string   `json:"email"`
			FirstName string   `json:"first_name"`
			Segments  []string `json:"segments"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email == "" {
			respondError(w, http.StatusBadRequest, "email is required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}
		if len(req.Segments) == 0 {
			req.Segments = []string{"general"}
		}
		s := &domain.NewsletterSubscriber{
			ID:         uuid.New(),
			Email:      req.Email,
			FirstName:  req.FirstName,
			Segments:   req.Segments,
			IsVerified: false,
		}
		if err := deps.Lead.CreateNewsletterSubscriber(r.Context(), s); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to subscribe")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]string{"status": "subscribed"})
	}
}

// --- Consultation Bookings ---

func handleCreateBooking(pool *pgxpool.Pool, emailSender domain.EmailSender, baseURL string) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email         string `json:"email"`
			FirstName     string `json:"first_name"`
			LastName      string `json:"last_name"`
			Organization  string `json:"organization"`
			Topic         string `json:"topic"`
			PreferredDate string `json:"preferred_date"`
			PreferredTime string `json:"preferred_time"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email == "" || req.Topic == "" {
			respondError(w, http.StatusBadRequest, "email and topic are required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}
		var prefDate *time.Time
		if req.PreferredDate != "" {
			if d, err := time.Parse("2006-01-02", req.PreferredDate); err == nil {
				prefDate = &d
			}
		}
		b := &domain.ConsultationBooking{
			ID:              uuid.New(),
			Email:           req.Email,
			FirstName:       req.FirstName,
			LastName:        req.LastName,
			Organization:    req.Organization,
			Topic:           req.Topic,
			PreferredDate:   prefDate,
			PreferredTime:   req.PreferredTime,
			DurationMinutes: 45,
			Status:          "requested",
		}
		if err := deps.Lead.CreateConsultationBooking(r.Context(), b); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create booking")
			return
		}
		go dispatchEvent(r.Context(), pool, "booking_request", "New Booking Request", fmt.Sprintf("%s requested a %s call.", req.Email, req.Topic), map[string]any{
			"email": req.Email,
			"topic": req.Topic,
		})
		// Send confirmation email to client
		if emailSender != nil {
			go func() {
				name := req.FirstName
				if name == "" {
					name = req.Email
				}
				dateStr := "Not specified"
				if prefDate != nil {
					dateStr = prefDate.Format("Monday, Jan 2, 2006")
				}
				timeStr := req.PreferredTime
				if timeStr == "" {
					timeStr = "Not specified"
				}
				subject, htmlBody, textBody := email.BookingConfirmationEmail(email.BookingConfirmationData{
					Name:   name,
					Email:  req.Email,
					Topic:  req.Topic,
					Date:   dateStr,
					Time:   timeStr,
					Status: "requested",
				})
				_ = emailSender.Send(r.Context(), req.Email, subject, htmlBody, textBody)
			}()
		}
		respondJSON(w, http.StatusCreated, map[string]any{"booking_id": b.ID, "status": b.Status})
	}
}

func handleListBookings(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		bookings, err := deps.Lead.ListConsultationBookings(r.Context(), status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list bookings")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"bookings": bookings})
	}
}

func handleUpdateBooking(pool *pgxpool.Pool, emailSender domain.EmailSender, baseURL string) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Status      string `json:"status"`
			ScheduledAt string `json:"scheduled_at"`
			Notes       string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		var scheduledAt *time.Time
		if req.ScheduledAt != "" {
			if t, err := time.Parse(time.RFC3339, req.ScheduledAt); err == nil {
				scheduledAt = &t
			}
		}
		if err := deps.Lead.UpdateConsultationBookingStatus(r.Context(), id, req.Status, scheduledAt, req.Notes); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update booking")
			return
		}
		// Send status update email to client
		if emailSender != nil && (req.Status == "confirmed" || req.Status == "cancelled") {
			go func() {
				// Fetch the booking to get client details
				bookings, _ := deps.Lead.ListConsultationBookings(r.Context(), "")
				for _, b := range bookings {
					if b.ID.String() == id {
						name := b.FirstName
						if name == "" {
							name = b.Email
						}
						dateStr := "Not specified"
						if scheduledAt != nil {
							dateStr = scheduledAt.Format("Monday, Jan 2, 2006 at 3:04 PM")
						} else if b.PreferredDate != nil {
							dateStr = b.PreferredDate.Format("Monday, Jan 2, 2006")
						}
						timeStr := b.PreferredTime
						if timeStr == "" {
							timeStr = "Not specified"
						}
						subject, htmlBody, textBody := email.BookingConfirmationEmail(email.BookingConfirmationData{
							Name:         name,
							Email:        b.Email,
							Topic:        b.Topic,
							Date:         dateStr,
							Time:         timeStr,
							Status:       req.Status,
							DashboardURL: baseURL + "/contact",
						})
						_ = emailSender.Send(r.Context(), b.Email, subject, htmlBody, textBody)
						break
					}
				}
			}()
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

// --- Careers ---

func handleListRoles(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		roles, err := deps.Talent.ListJobRoles(r.Context(), true)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list roles")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"roles": roles})
	}
}

func handleGetRole(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		role, err := deps.Talent.GetJobRoleBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		respondJSON(w, http.StatusOK, role)
	}
}

func handleApplyRole(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		role, err := deps.Talent.GetJobRoleBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		var req struct {
			ApplicantName  string         `json:"applicant_name"`
			ApplicantEmail string         `json:"applicant_email"`
			ApplicantPhone string         `json:"applicant_phone"`
			ResumeURL      string         `json:"resume_url"`
			CoverLetter    string         `json:"cover_letter"`
			PortfolioURL   string         `json:"portfolio_url"`
			LinkedInURL    string         `json:"linkedin_url"`
			Answers        map[string]any `json:"answers"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.ApplicantName == "" || req.ApplicantEmail == "" {
			respondError(w, http.StatusBadRequest, "applicant_name and applicant_email are required")
			return
		}
		if _, err := mail.ParseAddress(req.ApplicantEmail); err != nil {
			respondError(w, http.StatusBadRequest, "invalid applicant_email")
			return
		}
		a := &domain.Application{
			ID:             uuid.New(),
			RoleID:         &role.ID,
			ApplicantName:  req.ApplicantName,
			ApplicantEmail: req.ApplicantEmail,
			ApplicantPhone: req.ApplicantPhone,
			ResumeURL:      req.ResumeURL,
			CoverLetter:    req.CoverLetter,
			PortfolioURL:   req.PortfolioURL,
			LinkedInURL:    req.LinkedInURL,
			Answers:        req.Answers,
			Status:         "received",
		}
		if err := deps.Talent.CreateApplication(r.Context(), a); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to submit application")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"application_id": a.ID, "status": a.Status})
	}
}

func handleTalentNetwork(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email          string   `json:"email"`
			FirstName      string   `json:"first_name"`
			LastName       string   `json:"last_name"`
			Domains        []string `json:"domains"`
			SeniorityLevel string   `json:"seniority_level"`
			LinkedInURL    string   `json:"linkedin_url"`
			PortfolioURL   string   `json:"portfolio_url"`
			Bio            string   `json:"bio"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email == "" {
			respondError(w, http.StatusBadRequest, "email is required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}
		m := &domain.TalentNetworkMember{
			ID:             uuid.New(),
			Email:          req.Email,
			FirstName:      req.FirstName,
			LastName:       req.LastName,
			Domains:        req.Domains,
			SeniorityLevel: req.SeniorityLevel,
			LinkedInURL:    req.LinkedInURL,
			PortfolioURL:   req.PortfolioURL,
			Bio:            req.Bio,
			IsActive:       true,
		}
		if err := deps.Talent.CreateTalentNetworkMember(r.Context(), m); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to join talent network")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]string{"status": "joined"})
	}
}

func handleMyApplications(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		email, ok := r.Context().Value(userEmailKey).(string)
		if !ok || email == "" {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		apps, err := deps.Talent.ListApplicationsByEmail(r.Context(), email)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list applications")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"applications": apps})
	}
}

// --- Subsidiaries ---

func handleListSubsidiaries(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		subs, err := deps.Content.ListSubsidiaries(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list subsidiaries")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"subsidiaries": subs})
	}
}

// --- Visualizations ---

func handleHoldingTree(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		subs, _ := deps.Content.ListSubsidiaries(r.Context())
		services, _ := deps.Content.ListServices(r.Context())
		labs, _ := deps.Content.ListLabsProducts(r.Context())
		respondJSON(w, http.StatusOK, map[string]any{
			"parent": map[string]string{
				"name": "XCreativs Technologies",
				"type": "holding_company",
			},
			"children": []map[string]any{
				{"name": "Services", "type": "division", "items": services},
				{"name": "Labs", "type": "division", "items": labs},
				{"name": "Subsidiaries", "type": "division", "items": subs},
			},
		})
	}
}

func handleLiveEngagementCounter(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var counts struct {
			ActiveEngagements    int `json:"active_engagements"`
			DeliverablesInFlight int `json:"deliverables_in_flight"`
			SectorsCovered       int `json:"sectors_covered"`
			CapabilitiesDeployed int `json:"capabilities_deployed"`
			TeamMembers          int `json:"team_members"`
			DecisionsLogged      int `json:"decisions_logged"`
		}
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.engagements WHERE stage IN ('active', 'proposal')`).Scan(&counts.ActiveEngagements)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.deliverables WHERE status IN ('in_progress', 'pending_review', 'published')`).Scan(&counts.DeliverablesInFlight)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(DISTINCT sector) FROM engagement.engagements WHERE sector IS NOT NULL`).Scan(&counts.SectorsCovered)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.capability_deliveries`).Scan(&counts.CapabilitiesDeployed)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.team_members`).Scan(&counts.TeamMembers)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.decisions`).Scan(&counts.DecisionsLogged)
		respondJSON(w, http.StatusOK, counts)
	}
}

func handleAnalyticsDashboard(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var metrics struct {
			Visitors30d           int `json:"visitors_30d"`
			PageViews30d          int `json:"page_views_30d"`
			DiagnosticsStarted30d int `json:"diagnostics_started_30d"`
			RFPsSubmitted30d      int `json:"rfps_submitted_30d"`
			PortalLogins30d       int `json:"portal_logins_30d"`
			PortalActions30d      int `json:"portal_actions_30d"`
			NewApplications30d    int `json:"new_applications_30d"`
			NewPartnerships30d    int `json:"new_partnerships_30d"`
			ActiveEngagements     int `json:"active_engagements"`
			ActiveUsers           int `json:"active_users"`
		}

		_ = pool.QueryRow(r.Context(), `SELECT COUNT(DISTINCT visitor_id) FROM identity.analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.Visitors30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.PageViews30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'diagnostic_start' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.DiagnosticsStarted30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'rfp_submit' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.RFPsSubmitted30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'portal_login' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.PortalLogins30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type IN ('deliverable_view','approval_action','comment_create') AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.PortalActions30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM talent.applications WHERE created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.NewApplications30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM partner.applications WHERE created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.NewPartnerships30d)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM engagement.engagements WHERE stage IN ('active','proposal')`).Scan(&metrics.ActiveEngagements)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(DISTINCT user_id) FROM identity.analytics_events WHERE user_id IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`).Scan(&metrics.ActiveUsers)

		// Daily page views for chart
		rows, _ := pool.Query(r.Context(), `
			SELECT DATE(created_at)::text as day, COUNT(*) as views
			FROM identity.analytics_events
			WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '30 days'
			GROUP BY DATE(created_at)
			ORDER BY day
		`)
		var dailyViews []map[string]any
		for rows.Next() {
			var day string
			var views int
			_ = rows.Scan(&day, &views)
			dailyViews = append(dailyViews, map[string]any{"day": day, "views": views})
		}
		rows.Close()

		// Top pages
		rows, _ = pool.Query(r.Context(), `
			SELECT page_path, COUNT(*) as views
			FROM identity.analytics_events
			WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '30 days'
			GROUP BY page_path
			ORDER BY views DESC
			LIMIT 10
		`)
		var topPages []map[string]any
		for rows.Next() {
			var path string
			var views int
			_ = rows.Scan(&path, &views)
			topPages = append(topPages, map[string]any{"path": path, "views": views})
		}
		rows.Close()

		// Conversion funnel
		var funnel struct {
			Visitors    int `json:"visitors"`
			Diagnostics int `json:"diagnostics"`
			RFPs        int `json:"rfps"`
			PortalUsers int `json:"portal_users"`
		}
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(DISTINCT visitor_id) FROM identity.analytics_events WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&funnel.Visitors)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'diagnostic_start' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&funnel.Diagnostics)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM identity.analytics_events WHERE event_type = 'rfp_submit' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&funnel.RFPs)
		_ = pool.QueryRow(r.Context(), `SELECT COUNT(DISTINCT user_id) FROM identity.analytics_events WHERE event_type = 'portal_login' AND created_at > NOW() - INTERVAL '30 days'`).Scan(&funnel.PortalUsers)

		respondJSON(w, http.StatusOK, map[string]any{
			"metrics":     metrics,
			"daily_views": dailyViews,
			"top_pages":   topPages,
			"funnel":      funnel,
		})
	}
}

// Layer 06: Annotated Bibliography handlers

func handleListReadingListItems(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		category := r.URL.Query().Get("category")
		items, err := deps.Content.ListReadingListItems(r.Context(), category)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list reading list items")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"items": items})
	}
}

func handleGetReadingListItem(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		item, err := deps.Content.GetReadingListItemBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "reading list item not found")
			return
		}
		respondJSON(w, http.StatusOK, item)
	}
}

// Layer 06: Audio Brief handlers

func handleListAudioBriefs(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		briefs, err := deps.Content.ListAudioBriefs(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list audio briefs")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"audio_briefs": briefs})
	}
}

func handleGetAudioBrief(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		brief, err := deps.Content.GetAudioBriefBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "audio brief not found")
			return
		}
		respondJSON(w, http.StatusOK, brief)
	}
}

// Layer 06: Webinar handlers

func handleListWebinars(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		webinars, err := deps.Content.ListWebinars(r.Context(), status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list webinars")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"webinars": webinars})
	}
}

func handleGetWebinar(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		webinar, err := deps.Content.GetWebinarBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "webinar not found")
			return
		}
		respondJSON(w, http.StatusOK, webinar)
	}
}

func handleRegisterForWebinar(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email        string `json:"email"`
			FirstName    string `json:"first_name"`
			LastName     string `json:"last_name"`
			Organization string `json:"organization"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Email == "" {
			respondError(w, http.StatusBadRequest, "email is required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}

		slug := chi.URLParam(r, "slug")
		webinar, err := deps.Content.GetWebinarBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "webinar not found")
			return
		}

		reg := &domain.WebinarRegistration{
			WebinarID:    webinar.ID,
			Email:        req.Email,
			FirstName:    req.FirstName,
			LastName:     req.LastName,
			Organization: req.Organization,
		}
		if err := deps.Content.RegisterForWebinar(r.Context(), reg); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to register")
			return
		}

		respondJSON(w, http.StatusOK, map[string]string{"status": "registered"})
	}
}

// --- Assessment handlers ---

func handleGetAssessmentTemplate(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		template, err := deps.Assessment.GetAssessmentTemplateBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "template not found")
			return
		}
		questions, err := deps.Assessment.ListAssessmentQuestions(r.Context(), template.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to load questions")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"template":  template,
			"questions": questions,
		})
	}
}

func handleCreateAssessmentSession(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			TemplateID   string `json:"template_id"`
			Email        string `json:"email"`
			Organization string `json:"organization"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		templateID, err := uuid.Parse(req.TemplateID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid template_id")
			return
		}
		s := &domain.AssessmentSession{
			ID:           uuid.New(),
			TemplateID:   templateID,
			Email:        req.Email,
			Organization: req.Organization,
			Status:       "in_progress",
			Answers:      []domain.AnswerEntry{},
		}
		if err := deps.Assessment.CreateAssessmentSession(r.Context(), s); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create session")
			return
		}
		respondJSON(w, http.StatusCreated, map[string]any{"session_id": s.ID, "status": s.Status})
	}
}

func handleSubmitAssessmentAnswers(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "id")
		var req struct {
			Answers []domain.AnswerEntry `json:"answers"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}

		session, err := deps.Assessment.GetAssessmentSession(r.Context(), sessionID)
		if err != nil {
			respondError(w, http.StatusNotFound, "session not found")
			return
		}

		questions, err := deps.Assessment.ListAssessmentQuestions(r.Context(), session.TemplateID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to load questions")
			return
		}

		// Merge new answers with existing
		answerMap := map[uuid.UUID]int{}
		for _, a := range session.Answers {
			answerMap[a.QuestionID] = a.Value
		}
		for _, a := range req.Answers {
			answerMap[a.QuestionID] = a.Value
		}

		var mergedAnswers []domain.AnswerEntry
		for qid, val := range answerMap {
			mergedAnswers = append(mergedAnswers, domain.AnswerEntry{QuestionID: qid, Value: val})
		}
		session.Answers = mergedAnswers

		// Calculate scores per dimension
		scores := map[string]int{}
		for _, a := range mergedAnswers {
			for _, q := range questions {
				if q.ID == a.QuestionID {
					scores[q.Dimension] += a.Value
					break
				}
			}
		}
		session.Scores = scores

		// Overall score (sum of all dimension scores, max 5 per question)
		overall := 0
		for _, s := range scores {
			overall += s
		}
		session.OverallScore = overall

		// Generate recommendation based on overall score
		maxPossible := len(questions) * 5
		pct := 0
		if maxPossible > 0 {
			pct = (overall * 100) / maxPossible
		}
		switch {
		case pct >= 80:
			session.RecommendationSummary = "Your digital systems demonstrate strong maturity across all dimensions. Consider advanced AI integration and strategic expansion."
		case pct >= 60:
			session.RecommendationSummary = "Solid foundation with targeted gaps. Prioritise data governance and security hardening for immediate impact."
		case pct >= 40:
			session.RecommendationSummary = "Mixed maturity with significant improvement opportunities. A structured audit and roadmap engagement is recommended."
		default:
			session.RecommendationSummary = "Critical gaps identified across multiple dimensions. Urgent strategic intervention advised — begin with a comprehensive digital systems audit."
		}

		now := time.Now()
		session.CompletedAt = &now
		session.Status = "completed"

		if err := deps.Assessment.UpdateAssessmentSession(r.Context(), session); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to save results")
			return
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"session_id":             session.ID,
			"status":                 session.Status,
			"scores":                 session.Scores,
			"overall_score":          session.OverallScore,
			"max_possible":           maxPossible,
			"percentage":             pct,
			"recommendation_summary": session.RecommendationSummary,
		})
	}
}

// --- Notification helpers ---

func dispatchEvent(ctx context.Context, pool *pgxpool.Pool, event string, title, body string, payload map[string]any) {
	// Use background context since this may run in a goroutine after request ends
	bgCtx := context.Background()

	// 1. Notify admins via in-app notifications
	rows, err := pool.Query(bgCtx, `SELECT id FROM identity.users WHERE role = 'admin'`)
	if err == nil {
		var adminIDs []uuid.UUID
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err == nil {
				adminIDs = append(adminIDs, id)
			}
		}
		rows.Close()

		now := time.Now()
		for _, adminID := range adminIDs {
			_, _ = pool.Exec(bgCtx, `
				INSERT INTO comms.notifications (id, user_id, title, body, notification_type, channel, is_read, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, uuid.New(), adminID, title, body, event, "in_app", false, now)
		}
	}

	// 2. Deliver to subscribed webhooks
	go func() {
		webhookRows, err := pool.Query(bgCtx, `
			SELECT id FROM portal_config.webhook_subscriptions
			WHERE is_active = TRUE AND ($1 = ANY(events) OR 'all' = ANY(events))
		`, event)
		if err != nil {
			return
		}
		defer webhookRows.Close()

		for webhookRows.Next() {
			var subID uuid.UUID
			if err := webhookRows.Scan(&subID); err == nil {
				deliverWebhook(pool, subID, event, payload)
			}
		}
	}()
}

// --- Admin RFP handlers ---

func handleListRFPSubmissions(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		rfps, err := deps.Lead.ListRFPSubmissions(r.Context(), status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list RFPs")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"rfps": rfps})
	}
}

func handleGetRFPSubmission(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		rfp, err := deps.Lead.GetRFPSubmission(r.Context(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "RFP not found")
			return
		}
		respondJSON(w, http.StatusOK, rfp)
	}
}

func handleUpdateRFPSubmission(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var req struct {
			Status     string     `json:"status"`
			AssignedTo *uuid.UUID `json:"assigned_to"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if err := deps.Lead.UpdateRFPSubmissionStatus(r.Context(), id, req.Status, req.AssignedTo); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update RFP")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
