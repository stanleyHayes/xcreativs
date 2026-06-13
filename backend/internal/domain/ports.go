package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// IdentityRepository defines storage for users, sessions, and audit.
type IdentityRepository interface {
	CreateUser(ctx context.Context, u *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id string) (*User, error)
	UpdateLastLogin(ctx context.Context, id string) error
	EnableMFA(ctx context.Context, id, secret string) error
	UpdateUser(ctx context.Context, id string, firstName, lastName, email string) error
	CreateSession(ctx context.Context, s *Session) error
	GetSessionByRefreshToken(ctx context.Context, hash string) (*Session, error)
	RevokeSession(ctx context.Context, id string) error
	RevokeAllUserSessions(ctx context.Context, userID string) error
	ListUserSessions(ctx context.Context, userID string) ([]Session, error)
	CreateAuditLog(ctx context.Context, a *AuditLog) error
	ListAuditLogs(ctx context.Context, userID string, limit int) ([]AuditLog, error)
	GetPermissionsForRole(ctx context.Context, role string) ([]Permission, error)
	SeedPermissions(ctx context.Context) error

	// API Keys
	CreateAPIKey(ctx context.Context, k *APIKey) error
	GetAPIKeyByHash(ctx context.Context, hash string) (*APIKey, error)
	ListAPIKeysByUser(ctx context.Context, userID string) ([]APIKey, error)
	RevokeAPIKey(ctx context.Context, id string) error
	UpdateAPIKeyLastUsed(ctx context.Context, id string) error

	// Password Reset
	CreatePasswordResetToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error
	GetPasswordResetToken(ctx context.Context, tokenHash string) (*PasswordResetToken, error)
	MarkPasswordResetTokenUsed(ctx context.Context, tokenHash string) error
	UpdateUserPassword(ctx context.Context, userID string, passwordHash string) error

	// Email Verification
	CreateEmailVerificationToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error
	GetEmailVerificationToken(ctx context.Context, tokenHash string) (*EmailVerificationToken, error)
	MarkEmailVerificationTokenUsed(ctx context.Context, tokenHash string) error
	VerifyUserEmail(ctx context.Context, userID string) error
}

// ContentRepository defines storage for public content.
type ContentRepository interface {
	GetPageBySlug(ctx context.Context, slug string) (*Page, error)
	ListServices(ctx context.Context) ([]Service, error)
	GetServiceBySlug(ctx context.Context, slug string) (*Service, error)
	ListLabsProducts(ctx context.Context) ([]LabsProduct, error)
	GetLabsProductBySlug(ctx context.Context, slug string) (*LabsProduct, error)
	ListSubsidiaries(ctx context.Context) ([]Subsidiary, error)
	ListCaseDossiers(ctx context.Context, filters map[string]string) ([]CaseDossier, error)
	GetCaseDossierBySlug(ctx context.Context, slug string) (*CaseDossier, error)
	ListIndustries(ctx context.Context) ([]Industry, error)
	GetIndustryBySlug(ctx context.Context, slug string) (*Industry, error)
	ListInsights(ctx context.Context, contentType, lang string) ([]Insight, error)
	GetInsightBySlug(ctx context.Context, slug string) (*Insight, error)
	ListGlossary(ctx context.Context) ([]GlossaryTerm, error)
	ListFAQ(ctx context.Context) ([]FAQ, error)
	ListPressReleases(ctx context.Context) ([]PressRelease, error)
	ListMediaKit(ctx context.Context) ([]MediaKitAsset, error)
	GetLiveTicker(ctx context.Context) (*LiveTicker, error)
	SearchPublic(ctx context.Context, query, lang string) ([]SearchResult, error)
	SearchPortal(ctx context.Context, query, userID string) ([]SearchResult, error)
	ListReadingListItems(ctx context.Context, category string) ([]ReadingListItem, error)
	GetReadingListItemBySlug(ctx context.Context, slug string) (*ReadingListItem, error)
	ListAudioBriefs(ctx context.Context) ([]AudioBrief, error)
	GetAudioBriefBySlug(ctx context.Context, slug string) (*AudioBrief, error)
	ListWebinars(ctx context.Context, status string) ([]Webinar, error)
	GetWebinarBySlug(ctx context.Context, slug string) (*Webinar, error)
	RegisterForWebinar(ctx context.Context, reg *WebinarRegistration) error
	GetWebinarRegistrations(ctx context.Context, webinarID string) ([]WebinarRegistration, error)

	// Admin content management
	ListPages(ctx context.Context, status string) ([]Page, error)
	GetPageByID(ctx context.Context, id string) (*Page, error)
	CreatePage(ctx context.Context, p *Page) error
	UpdatePage(ctx context.Context, p *Page) error
	DeletePage(ctx context.Context, id string) error
	InvalidatePageCache(ctx context.Context, slug string)
}

// LeadRepository defines storage for lead qualification.
type LeadRepository interface {
	CreateDiagnostic(ctx context.Context, d *Diagnostic) error
	GetDiagnostic(ctx context.Context, id string) (*Diagnostic, error)
	UpdateDiagnosticAnswers(ctx context.Context, id string, answers []any, routing string) error
	CompleteDiagnostic(ctx context.Context, id string, summaryPDF string, scope, nextSteps string) error
	ListDiagnosticQuestions(ctx context.Context) ([]DiagnosticQuestion, error)
	CreateScopeEstimate(ctx context.Context, e *ScopeEstimate) error
	CreateRFPSubmission(ctx context.Context, r *RFPSubmission) error
	ListRFPSubmissions(ctx context.Context, status string) ([]RFPSubmission, error)
	GetRFPSubmission(ctx context.Context, id string) (*RFPSubmission, error)
	UpdateRFPSubmissionStatus(ctx context.Context, id string, status string, assignedTo *uuid.UUID) error
	CreateNewsletterSubscriber(ctx context.Context, s *NewsletterSubscriber) error
	GetNewsletterSubscriberByEmail(ctx context.Context, email string) (*NewsletterSubscriber, error)
	CreateConsultationBooking(ctx context.Context, b *ConsultationBooking) error
	ListConsultationBookings(ctx context.Context, status string) ([]ConsultationBooking, error)
	UpdateConsultationBookingStatus(ctx context.Context, id string, status string, scheduledAt *time.Time, notes string) error
}

// TalentRepository defines storage for careers.
type TalentRepository interface {
	ListJobRoles(ctx context.Context, isOpen bool) ([]JobRole, error)
	GetJobRoleBySlug(ctx context.Context, slug string) (*JobRole, error)
	CreateApplication(ctx context.Context, a *Application) error
	ListApplicationsByEmail(ctx context.Context, email string) ([]Application, error)
	CreateTalentNetworkMember(ctx context.Context, m *TalentNetworkMember) error
	ListInternshipPrograms(ctx context.Context, isOpen bool) ([]InternshipProgram, error)
}

// EngagementRepository defines storage for client engagements.
type EngagementRepository interface {
	CreateEngagement(ctx context.Context, e *Engagement) error
	ListEngagementsByUser(ctx context.Context, userID string) ([]Engagement, error)
	ListAllEngagements(ctx context.Context) ([]Engagement, error)
	GetEngagementByID(ctx context.Context, id string) (*Engagement, error)
	ListMilestones(ctx context.Context, engagementID string) ([]Milestone, error)
	CreateMilestone(ctx context.Context, m *Milestone) error
	UpdateMilestone(ctx context.Context, m *Milestone) error
	DeleteMilestone(ctx context.Context, id string) error
	ListDeliverables(ctx context.Context, engagementID string, role string) ([]Deliverable, error)
	CreateDeliverable(ctx context.Context, d *Deliverable) error
	UpdateDeliverable(ctx context.Context, d *Deliverable) error
	DeleteDeliverable(ctx context.Context, id string) error
	ListDecisions(ctx context.Context, engagementID string) ([]Decision, error)
	CreateDecision(ctx context.Context, d *Decision) error
	UpdateDecision(ctx context.Context, d *Decision) error
	DeleteDecision(ctx context.Context, id string) error
	ListRisks(ctx context.Context, engagementID string) ([]Risk, error)
	CreateRisk(ctx context.Context, r *Risk) error
	UpdateRisk(ctx context.Context, r *Risk) error
	DeleteRisk(ctx context.Context, id string) error
	ListCapabilityDeliveries(ctx context.Context, engagementID string) ([]CapabilityDelivery, error)
	ListBudgetLines(ctx context.Context, engagementID string) ([]BudgetLine, error)
	ListInvoices(ctx context.Context, engagementID string) ([]Invoice, error)
	ListTeamMembers(ctx context.Context, engagementID string) ([]TeamMember, error)
	CreateTeamMember(ctx context.Context, t *TeamMember) error
	RemoveTeamMember(ctx context.Context, id string) error
	ListSupportTickets(ctx context.Context, engagementID string) ([]SupportTicket, error)
	CreateSupportTicket(ctx context.Context, t *SupportTicket) error
	UpdateSupportTicket(ctx context.Context, t *SupportTicket) error
	DeleteSupportTicket(ctx context.Context, id string) error
	ListActivityFeed(ctx context.Context, engagementID string, limit int) ([]ActivityFeedItem, error)
	ListNotifications(ctx context.Context, userID string, limit int) ([]Notification, error)
	MarkNotificationRead(ctx context.Context, id string) error
	CreateNotification(ctx context.Context, n *Notification) error
	GetUnreadNotificationCount(ctx context.Context, userID string) (int, error)
	ListThreads(ctx context.Context, engagementID string, parentType string, parentID string) ([]Thread, error)
	CreateThread(ctx context.Context, t *Thread) error
	ListComments(ctx context.Context, threadID string) ([]Comment, error)
	CreateComment(ctx context.Context, c *Comment) error
	ListDocumentLibrary(ctx context.Context, engagementID string, role string) ([]DocumentLibraryItem, error)
	ListReports(ctx context.Context, engagementID string, role string) ([]Report, error)
	ListApprovalWorkflows(ctx context.Context, engagementID string) ([]ApprovalWorkflow, error)
	CreateApprovalWorkflow(ctx context.Context, a *ApprovalWorkflow) error
	UpdateApprovalWorkflow(ctx context.Context, id string, status, comments, rejectedReason string) error
}

// ConciergeRepository defines storage for the AI Concierge.
type ConciergeRepository interface {
	CreateChatSession(ctx context.Context, s *ChatSession) (*ChatSession, error)
	GetChatSession(ctx context.Context, id string) (*ChatSession, error)
	ListChatSessions(ctx context.Context, userID string, visitorID string, limit int) ([]ChatSession, error)
	UpdateChatSessionStatus(ctx context.Context, id string, status string) error
	CloseChatSession(ctx context.Context, id string) error
	CreateChatMessage(ctx context.Context, m *ChatMessage) error
	ListChatMessages(ctx context.Context, sessionID string, limit int) ([]ChatMessage, error)
	SearchKnowledgeBase(ctx context.Context, query string) ([]KnowledgeBaseEntry, error)
	ListKnowledgeBase(ctx context.Context, category string) ([]KnowledgeBaseEntry, error)
}

// AssessmentRepository defines storage for readiness assessments.
type AssessmentRepository interface {
	GetAssessmentTemplateBySlug(ctx context.Context, slug string) (*AssessmentTemplate, error)
	ListAssessmentQuestions(ctx context.Context, templateID string) ([]AssessmentQuestion, error)
	CreateAssessmentSession(ctx context.Context, s *AssessmentSession) error
	GetAssessmentSession(ctx context.Context, id string) (*AssessmentSession, error)
	UpdateAssessmentSession(ctx context.Context, s *AssessmentSession) error
}

// PortalConfigRepository defines storage for portal configuration.
type PortalConfigRepository interface {
	GetClientThemeByEngagement(ctx context.Context, engagementID string) (*ClientTheme, error)
	UpsertClientTheme(ctx context.Context, t *ClientTheme) error
}

// SignatureRepository defines storage for signature requests.
type SignatureRepository interface {
	CreateSignatureRequest(ctx context.Context, s *SignatureRequest) error
	ListSignatureRequests(ctx context.Context, status string, userID string) ([]SignatureRequest, error)
	GetSignatureRequest(ctx context.Context, id string) (*SignatureRequest, error)
	SendSignatureRequest(ctx context.Context, id string, signingURL string, expiresAt time.Time) error
	UpdateSignatureStatus(ctx context.Context, id string, status string, signedDocumentURL string) error
}

// EmailSender defines the contract for sending transactional emails.
type EmailSender interface {
	Send(ctx context.Context, to, subject, htmlBody, textBody string) error
}

// SearchResult is a unified search result type.
type SearchResult struct {
	Type  string `json:"type"`
	Slug  string `json:"slug"`
	Title string `json:"title"`
	Excerpt string `json:"excerpt"`
}
