package http

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/config"
	"xcreatives.com/backend/internal/domain"
	"xcreatives.com/backend/pkg/email"
	"xcreatives.com/backend/pkg/jwt"
)

// Router builds and returns the application router.
func NewRouter(cfg *config.Config, log Logger, pool *pgxpool.Pool, identity domain.IdentityRepository, jwtGen *jwt.Generator) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.RequestID)
	// RealIP is deprecated upstream over X-Forwarded-For spoofing concerns, but this
	// service runs behind a trusted reverse proxy (Render) that sets XFF, and per-client
	// rate limiting depends on the real client IP. Retained deliberately.
	r.Use(middleware.RealIP) //nolint:staticcheck // SA1019: trusted proxy, see comment above
	r.Use(LoggerMiddleware(log))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(SecurityHeadersMiddleware(cfg.Env == "production"))
	r.Use(CORSMiddleware(cfg.AllowedOrigins))
	r.Use(RequestSizeLimitMiddleware(1 << 20)) // 1MB default
	r.Use(RateLimitMiddleware(pool))

	// API documentation (Swagger UI + OpenAPI spec)
	r.Get("/docs", handleSwaggerUI())
	r.Get("/openapi.yaml", handleOpenAPISpec())

	// Health & readiness
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := pool.Ping(ctx); err != nil {
			respondError(w, http.StatusServiceUnavailable, "database unavailable")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})

	// Email sender
	emailSender := email.NewSender(cfg.ResendAPIKey, email.Config{
		FromAddress: cfg.EmailFromAddress,
		FromName:    cfg.EmailFromName,
		BaseURL:     cfg.BaseURL,
	})

	// Auth dependencies
	authDeps := &AuthHandlerDependencies{
		Identity:     identity,
		JWT:          jwtGen,
		Email:        emailSender,
		BaseURL:      cfg.BaseURL,
		AccessExpiry: 15 * time.Minute,
	}

	// API v1
	r.Route("/api/v1", func(api chi.Router) {
		// Public routes
		api.Post("/auth/register", handleRegister(authDeps))
		api.Post("/auth/login", handleLogin(authDeps))
		api.Post("/auth/refresh", handleRefresh(authDeps))
		api.Post("/auth/logout", handleLogout(authDeps))
		api.Post("/auth/forgot-password", handleForgotPassword(authDeps))
		api.Post("/auth/reset-password", handleResetPassword(authDeps))
		api.Post("/auth/verify-email", handleVerifyEmail(authDeps))
		// OAuth2 SSO (Google / Microsoft)
		api.Get("/auth/oauth/{provider}/login", handleOAuthLogin(authDeps))
		api.Get("/auth/oauth/{provider}/callback", handleOAuthCallback(pool, authDeps))

		// Authenticated routes
		api.Group(func(auth chi.Router) {
			auth.Use(APIKeyMiddleware(pool))
			auth.Use(AuthMiddleware(jwtGen))
			auth.Use(AuditLogMiddleware(pool))
			auth.Use(RequireMFAMiddleware(pool, cfg.MFARequired))

			auth.Get("/auth/me", handleMe(authDeps))
			auth.Post("/auth/mfa/enroll", handleMFAEnrollment(authDeps))
			auth.Post("/auth/mfa/verify", handleMFAVerify(authDeps))
			auth.Post("/auth/resend-verification", handleResendVerification(authDeps))
			auth.Get("/auth/sessions", handleListSessions(authDeps))
			auth.Delete("/auth/sessions/{id}", handleRevokeSession(authDeps))
			auth.Delete("/auth/sessions", handleRevokeAllSessions(authDeps))

			// Portal routes (placeholder for Phase B expansion)
			auth.Get("/portal", handlePortalHome(pool))
			auth.Get("/portal/engagements", handleListEngagements(pool))
			auth.Get("/portal/engagements/{id}", handleGetEngagement(pool))
			auth.Get("/portal/engagements/{id}/dashboard", handleEngagementDashboard(pool))
			auth.Get("/portal/engagements/{id}/milestones", handleListMilestones(pool))
			auth.Post("/portal/engagements/{id}/milestones", handleCreateMilestone(pool))
			auth.Patch("/portal/engagements/{id}/milestones/{milestoneID}", handleUpdateMilestone(pool))
			auth.Delete("/portal/engagements/{id}/milestones/{milestoneID}", handleDeleteMilestone(pool))
			auth.Get("/notifications", handleListNotifications(pool))
			auth.Get("/notifications/unread-count", handleGetUnreadNotificationCount(pool))
			auth.Put("/notifications/{id}/read", handleMarkNotificationRead(pool))
			auth.Get("/portal/theme", handleGetClientTheme(pool))
			auth.Post("/portal/theme", handleUpsertClientTheme(pool))
			auth.Get("/portal/engagements/{id}/deliverables", handleListDeliverables(pool))
			auth.Post("/portal/engagements/{id}/deliverables", handleCreateDeliverable(pool))
			auth.Patch("/portal/engagements/{id}/deliverables/{deliverableID}", handleUpdateDeliverable(pool))
			auth.Delete("/portal/engagements/{id}/deliverables/{deliverableID}", handleDeleteDeliverable(pool))
			auth.Get("/portal/engagements/{id}/decisions", handleListDecisions(pool))
			auth.Post("/portal/engagements/{id}/decisions", handleCreateDecision(pool))
			auth.Patch("/portal/engagements/{id}/decisions/{decisionID}", handleUpdateDecision(pool))
			auth.Delete("/portal/engagements/{id}/decisions/{decisionID}", handleDeleteDecision(pool))
			auth.Get("/portal/engagements/{id}/risks", handleListRisks(pool))
			auth.Post("/portal/engagements/{id}/risks", handleCreateRisk(pool))
			auth.Patch("/portal/engagements/{id}/risks/{riskID}", handleUpdateRisk(pool))
			auth.Delete("/portal/engagements/{id}/risks/{riskID}", handleDeleteRisk(pool))
			auth.Get("/portal/engagements/{id}/stakeholders", handleListStakeholders(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/stakeholders", handleCreateStakeholder(pool))
			auth.With(RequireScope("write")).Patch("/portal/engagements/{id}/stakeholders/{sid}", handleUpdateStakeholder(pool))
			auth.With(RequireScope("write")).Delete("/portal/engagements/{id}/stakeholders/{sid}", handleDeleteStakeholder(pool))
			auth.Get("/portal/engagements/{id}/activity", handleActivityFeed(pool))
			auth.Get("/portal/engagements/{id}/team", handleListTeamMembers(pool))
			auth.Post("/portal/engagements/{id}/team", handleCreateTeamMember(pool))
			auth.Delete("/portal/engagements/{id}/team/{memberID}", handleRemoveTeamMember(pool))
			auth.Get("/portal/engagements/{id}/tickets", handleListSupportTickets(pool))
			auth.Post("/portal/engagements/{id}/tickets", handleCreateSupportTicket(pool))
			auth.Patch("/portal/engagements/{id}/tickets/{ticketID}", handleUpdateSupportTicket(pool))
			auth.Delete("/portal/engagements/{id}/tickets/{ticketID}", handleDeleteSupportTicket(pool))
			auth.Get("/portal/engagements/{id}/budget", handleListBudgetLines(pool))
			auth.Get("/portal/engagements/{id}/invoices", handleListInvoices(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/invoices", handleGenerateInvoice(pool))
			auth.With(RequireScope("write")).Post("/invoices/{id}/payment-link", handleGeneratePaymentLink(pool))
			auth.With(RequireScope("write")).Patch("/invoices/{id}", handleUpdateInvoiceStatus(pool))
			auth.Get("/portal/engagements/{id}/capabilities", handleListCapabilityDeliveries(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/capabilities", handleCreateCapability(pool))
			auth.With(RequireScope("write")).Patch("/portal/engagements/{id}/capabilities/{cid}", handleUpdateCapability(pool))
			auth.With(RequireScope("write")).Delete("/portal/engagements/{id}/capabilities/{cid}", handleDeleteCapability(pool))
			auth.Get("/portal/engagements/{id}/demos", handleListDemoLinks(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/demos", handleCreateDemoLink(pool))
			auth.With(RequireScope("write")).Post("/demos/{id}/revoke", handleRevokeDemoLink(pool))
			auth.Get("/notifications/preferences", handleGetNotificationPreferences(pool))
			auth.Get("/audit-log", handleAuditLogExport(pool))
			auth.Put("/notifications/preferences", handleUpdateNotificationPreferences(pool))
			auth.Get("/portal/engagements/{id}/documents", handleListDocumentLibrary(pool))
			auth.Get("/portal/engagements/{id}/reports", handleListReports(pool))
			auth.Get("/portal/engagements/{id}/approvals", handleListApprovalWorkflows(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/approvals", handleCreateApprovalWorkflow(pool))
			auth.With(RequireScope("write")).Put("/approvals/{id}", handleUpdateApprovalWorkflow(pool))
			auth.Get("/portal/engagements/{id}/threads", handleListThreads(pool))
			auth.With(RequireScope("write")).Post("/portal/engagements/{id}/threads", handleCreateThread(pool))
			auth.Get("/threads/{thread_id}/comments", handleListComments(pool))
			auth.With(RequireScope("write")).Post("/threads/{thread_id}/comments", handleCreateComment(pool))
			auth.With(RequireScope("write")).Put("/auth/profile", handleUpdateProfile(authDeps))
			auth.Get("/careers/applications", handleMyApplications(pool))

			// API Keys
			auth.With(RequireScope("write")).Post("/api-keys", handleCreateAPIKey(pool))
			auth.With(RequireScope("read")).Get("/api-keys", handleListAPIKeys(pool))
			auth.With(RequireScope("write")).Post("/api-keys/{id}/revoke", handleRevokeAPIKey(pool))

			// Portal search
			auth.Get("/portal/search", handlePortalSearch(pool))

			// Partner portal
			auth.Get("/partner/dashboard", handlePartnerDashboard(pool))
			auth.Get("/partner/products", handlePartnerProducts(pool))
			auth.Get("/partner/agreements", handlePartnerAgreements(pool))
			auth.Get("/partner/referrals", handlePartnerReferrals(pool))
			auth.Post("/partner/referrals", handleCreateReferral(pool))
			auth.Get("/partner/orders", handlePartnerOrders(pool))
			// Partner co-development workspace
			auth.Get("/partner/products/{pid}/codev", handleListCodevItems(pool))
			auth.With(RequireScope("write")).Post("/partner/products/{pid}/codev", handleCreateCodevItem(pool))
			auth.With(RequireScope("write")).Patch("/partner/codev/{id}", handleUpdateCodevItem(pool))
			auth.With(RequireScope("write")).Delete("/partner/codev/{id}", handleDeleteCodevItem(pool))
			// Distribution training + performance
			auth.Get("/partner/training", handleListTrainingModules(pool))
			auth.With(RequireScope("write")).Post("/partner/training/{moduleId}/complete", handleCompleteTraining(pool))
			auth.Get("/partner/performance", handlePartnerPerformance(pool))
		})

		// Admin-only routes
		api.Group(func(admin chi.Router) {
			admin.Use(AuthMiddleware(jwtGen))
			admin.Use(RequireRole("admin"))
			admin.Use(AuditLogMiddleware(pool))

			admin.Get("/admin/analytics", handleAnalyticsDashboard(pool))
			admin.Get("/admin/partner/applications", handleListPartnerApplications(pool))
			admin.Put("/admin/partner/applications/{id}", handleUpdatePartnerApplication(pool))
			// Applicant tracking (ATS)
			admin.Get("/admin/applications", handleListApplicationsAdmin(pool))
			admin.Patch("/admin/applications/{id}/status", handleUpdateApplicationStatus(pool, emailSender))
			admin.Get("/admin/applications/{id}/interviews", handleListInterviews(pool))
			admin.Post("/admin/applications/{id}/interviews", handleScheduleInterview(pool, emailSender))
			admin.Patch("/admin/interviews/{iid}", handleUpdateInterview(pool))
			// Technical assessment challenges
			admin.Get("/admin/assessment-challenges", handleListChallenges(pool))
			admin.Post("/admin/assessment-challenges", handleCreateChallenge(pool))
			admin.Get("/admin/applications/{id}/assessments", handleListAssignments(pool))
			admin.Post("/admin/applications/{id}/assessments", handleAssignChallenge(pool, emailSender))
			admin.Patch("/admin/assessments/{aid}", handleReviewAssignment(pool))
			// Notifications: digests + segmented broadcast
			admin.Post("/admin/notifications/send-digests", handleSendDigests(pool, emailSender))
			admin.Post("/admin/notifications/broadcast", handleBroadcastNotification(pool, emailSender))
			admin.Post("/admin/concierge/reindex", handleReindexConcierge(pool))
			admin.Get("/admin/training-modules", handleListTrainingModules(pool))
			admin.Post("/admin/training-modules", handleCreateTrainingModule(pool))
			admin.Post("/admin/audio-briefs/{slug}/generate-tts", handleGenerateTTS(pool))
			admin.Get("/admin/rfps", handleListRFPSubmissions(pool))
			admin.Get("/admin/rfps/{id}", handleGetRFPSubmission(pool))
			admin.Put("/admin/rfps/{id}", handleUpdateRFPSubmission(pool))
			admin.Get("/admin/signatures", handleListSignatureRequests(pool))
			admin.Post("/admin/signatures", handleCreateSignatureRequest(pool))
			admin.Get("/admin/signatures/{id}", handleGetSignatureRequest(pool))
			admin.Post("/admin/signatures/{id}/send", handleSendSignatureRequest(pool, cfg.BaseURL))
			admin.Put("/admin/signatures/{id}", handleUpdateSignatureStatus(pool))
			admin.Get("/admin/bookings", handleListBookings(pool))
			admin.Put("/admin/bookings/{id}", handleUpdateBooking(pool, emailSender, cfg.BaseURL))
			admin.Get("/admin/webhooks", handleListWebhooks(pool))
			admin.Post("/admin/webhooks", handleCreateWebhook(pool))
			admin.Delete("/admin/webhooks/{id}", handleDeleteWebhook(pool))
			admin.Get("/admin/webhooks/deliveries", handleListWebhookDeliveries(pool))
			admin.Get("/admin/exports/bookings", handleExportBookings(pool))
			admin.Get("/admin/exports/rfps", handleExportRFPs(pool))
			admin.Get("/admin/exports/diagnostics", handleExportDiagnostics(pool))

			// Content management
			admin.Get("/admin/pages", handleListPages(pool))
			admin.Get("/admin/pages/{slug}", handleGetPage(pool))
			admin.Post("/admin/pages", handleCreatePage(pool))
			admin.Put("/admin/pages/{id}", handleUpdatePage(pool))
			admin.Delete("/admin/pages/{id}", handleDeletePage(pool))

			// Engagement management
			admin.Get("/admin/engagements", handleListAllEngagements(pool))
			admin.Post("/admin/engagements", handleCreateEngagement(pool))
		})

		// Public signing page
		api.Get("/sign/{id}", handleGetSigningPage(pool))
		api.Post("/sign/{id}", handleSubmitSignature(pool))

		// Public partnership application
		api.Post("/partners/apply", handleApplyPartnership(pool))

		// AI Concierge (public + authenticated)
		api.Post("/concierge/sessions", handleStartChat(pool))
		api.Post("/concierge/sessions/{session_id}/messages", handleSendMessage(pool))
		api.Get("/concierge/sessions/{session_id}/messages", handleGetChatHistory(pool))
		api.Post("/concierge/sessions/{session_id}/close", handleCloseChat(pool))
		api.Get("/concierge/sessions", handleListChatSessions(pool))

		// Public content routes
		api.Get("/pages/home", handleHomePage(pool))
		api.Get("/pages/about", handleAboutPage(pool))
		api.Get("/services", handleListServices(pool))
		api.Get("/services/{slug}", handleGetService(pool))
		api.Get("/labs", handleListLabs(pool))
		api.Get("/labs/{slug}", handleGetLabProduct(pool))
		api.Get("/work", handleListWork(pool))
		api.Get("/work/{slug}", handleGetWork(pool))
		api.Get("/industries", handleListIndustries(pool))
		api.Get("/industries/{slug}", handleGetIndustry(pool))
		api.Get("/insights", handleListInsights(pool))
		api.Get("/insights/{slug}", handleGetInsight(pool))
		api.Post("/insights/{slug}/download", handleDownloadInsight(pool))
		api.Get("/glossary", handleListGlossary(pool))
		api.Get("/faq", handleListFAQ(pool))
		api.Get("/press", handleListPress(pool))
		api.Get("/media-kit", handleListMediaKit(pool))
		// Layer 06 content
		api.Get("/reading-list", handleListReadingListItems(pool))
		api.Get("/reading-list/{slug}", handleGetReadingListItem(pool))
		api.Get("/audio-briefs", handleListAudioBriefs(pool))
		api.Get("/audio-briefs/{slug}", handleGetAudioBrief(pool))
		api.Get("/feed/audio", handleAudioFeed(pool))
		api.Get("/webinars", handleListWebinars(pool))
		api.Get("/webinars/{slug}", handleGetWebinar(pool))
		api.Post("/webinars/{slug}/register", handleRegisterForWebinar(pool))
		api.Post("/track", handleTrackEvent(pool))
		api.With(RequestSizeLimitMiddleware(10<<20)).Post("/document-intelligence/extract", handleDocumentExtract(pool))
		api.With(RequestSizeLimitMiddleware(11<<20)).Post("/document-intelligence/extract-file", handleDocumentExtractFile(pool))
		api.With(RequestSizeLimitMiddleware(16<<20)).Post("/uploads", handleUpload(pool))
		api.Get("/live-counter", handleLiveEngagementCounter(pool))
		api.Get("/assessments/{slug}", handleGetAssessmentTemplate(pool))
		// Token-gated public flows: embedded demos + candidate assessment challenges
		api.Get("/demos/{token}", handleAccessDemo(pool))
		api.Get("/assessments/challenge/{token}", handleGetCandidateChallenge(pool))
		api.Post("/assessments/challenge/{token}/submit", handleSubmitCandidateChallenge(pool))
		api.Post("/assessments/sessions", handleCreateAssessmentSession(pool))
		api.Post("/assessments/sessions/{id}/submit", handleSubmitAssessmentAnswers(pool))
		api.Get("/metrics/ticker", handleLiveTicker(pool))
		api.Get("/metrics/engagements", handleLiveEngagementCounter(pool))
		api.Get("/search", handleSearch(pool))
		api.Get("/visualizations/holding-tree", handleHoldingTree(pool))
		api.Get("/visualizations/value-flow", handleValueFlow(pool))
		api.Get("/tools/capability-lattice", handleCapabilityLatticeExplorer(pool))
		api.Post("/tools/tech-debt-estimate", handleTechDebtEstimate(pool))
		api.Post("/tools/cost-estimate", handleCostEstimate(pool))
		api.Get("/live-counter/stream", handleLiveCounterStream(pool))
		api.Get("/subsidiaries", handleListSubsidiaries(pool))

		// Lead Qualification
		api.Post("/diagnostics/start", handleStartDiagnostic(pool, emailSender, cfg.BaseURL))
		api.Post("/diagnostics/{id}/answer", handleAnswerDiagnostic(pool))
		api.Get("/diagnostics/{id}/result", handleDiagnosticResult(pool))
		api.Get("/diagnostics/{id}/summary.pdf", handleDiagnosticSummaryPDF(pool))
		api.Post("/estimates", handleCreateEstimate(pool))
		api.Post("/rfps", handleCreateRFP(pool, emailSender, cfg.BaseURL))
		api.Post("/newsletter/subscribe", handleNewsletterSubscribe(pool))
		api.Post("/bookings", handleCreateBooking(pool, emailSender, cfg.BaseURL))

		// Careers
		api.Get("/careers/roles", handleListRoles(pool))
		api.Get("/careers/roles/{slug}", handleGetRole(pool))
		api.Post("/careers/roles/{slug}/apply", handleApplyRole(pool))
		api.Post("/careers/talent-network", handleTalentNetwork(pool))
	})

	return r
}

// Logger is the interface expected by middleware.
type Logger interface {
	Debug(msg string, args ...any)
	Info(msg string, args ...any)
	Warn(msg string, args ...any)
	Error(msg string, args ...any)
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
