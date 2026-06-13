package domain

import (
	"time"

	"github.com/google/uuid"
)

// Engagement represents a client engagement/workspace.
type Engagement struct {
	ID                 uuid.UUID
	Slug               string
	ClientID           *uuid.UUID
	ClientName         string
	Title              string
	Description        string
	Sector             string
	ServiceLine        string
	Stage              string
	StartDate          *time.Time
	TargetEndDate      *time.Time
	ActualEndDate      *time.Time
	BudgetTotalUSD     *float64
	BudgetTotalGHS     *float64
	BudgetTotalEUR     *float64
	CurrencyPreference string
	IsWhiteLabel       bool
	WhiteLabelDomain   string
	WhiteLabelConfig   map[string]any
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// Milestone represents an engagement milestone.
type Milestone struct {
	ID          uuid.UUID
	EngagementID uuid.UUID
	Title       string
	Description string
	DueDate     *time.Time
	CompletedAt *time.Time
	Status      string
	SortOrder   int
	CreatedAt   time.Time
}

// Deliverable represents a produced document.
type Deliverable struct {
	ID               uuid.UUID
	EngagementID     uuid.UUID
	Title            string
	Description      string
	Version          int
	FileURL          string
	FileName         string
	FileSizeBytes    *int64
	MimeType         string
	SignatureStatus  string
	SignedAt         *time.Time
	SignedBy         *uuid.UUID
	VisibilityRole   string
	Status           string
	CreatedBy        *uuid.UUID
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// Decision represents a material decision.
type Decision struct {
	ID                   uuid.UUID
	EngagementID         uuid.UUID
	Title                string
	Description          string
	Rationale            string
	AlternativesConsidered string
	DecisionMaker        *uuid.UUID
	LinkedArtefacts      []any
	Status               string
	DecidedAt            *time.Time
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

// Risk represents an engagement risk.
type Risk struct {
	ID               uuid.UUID
	EngagementID     uuid.UUID
	Title            string
	Description      string
	Owner            *uuid.UUID
	MitigationPlan   string
	ResidualRating   string
	Severity         string
	EscalationStatus string
	Status           string
	LinkedDecisionID *uuid.UUID
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// CapabilityDelivery tracks capability delivery status.
type CapabilityDelivery struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	CapabilityName string
	Status       string
	ReasonDeferred string
	DeliveredAt  *time.Time
	SortOrder    int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// BudgetLine tracks budget items.
type BudgetLine struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	Item         string
	AllocatedUSD *float64
	AllocatedGHS *float64
	AllocatedEUR *float64
	SpentUSD     float64
	SpentGHS     float64
	SpentEUR     float64
	Category     string
	CreatedAt    time.Time
}

// Invoice represents a billing invoice.
type Invoice struct {
	ID                 uuid.UUID
	EngagementID       uuid.UUID
	InvoiceNumber      string
	MilestoneID        *uuid.UUID
	Amount             float64
	Currency           string
	Status             string
	StripePaymentLink  string
	PaystackPaymentLink string
	PaidAt             *time.Time
	DueDate            *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// ApprovalWorkflow tracks deliverable approvals.
type ApprovalWorkflow struct {
	ID            uuid.UUID
	EngagementID  uuid.UUID
	DeliverableID *uuid.UUID
	Title         string
	ApproverID    *uuid.UUID
	Status        string
	Comments      string
	RejectedReason string
	RequestedAt   time.Time
	RespondedAt   *time.Time
}

// Report represents a generated report.
type Report struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	Title        string
	ReportType   string
	FileURL      string
	RoleScope    string
	CreatedAt    time.Time
}

// DocumentLibraryItem represents a reference document.
type DocumentLibraryItem struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	Title        string
	DocType      string
	FileURL      string
	RoleScope    string
	CreatedAt    time.Time
}

// TeamMember represents someone on the engagement.
type TeamMember struct {
	ID                 uuid.UUID
	EngagementID       uuid.UUID
	UserID             *uuid.UUID
	Name               string
	Role               string
	Email              string
	AvailabilityStatus string
	IsXCreativs        bool
	CreatedAt          time.Time
}

// SupportTicket represents a client support request.
type SupportTicket struct {
	ID             uuid.UUID
	EngagementID   uuid.UUID
	Title          string
	Description    string
	RequesterID    *uuid.UUID
	Status         string
	Priority       string
	SLATargetHours *int
	SLABreached    bool
	ResolvedAt     *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
