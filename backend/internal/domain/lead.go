package domain

import (
	"time"

	"github.com/google/uuid"
)

// Diagnostic represents a prospect diagnostic session.
type Diagnostic struct {
	ID                   uuid.UUID
	Email                string
	ProspectName         string
	Organization         string
	Sector               string
	Answers              []any
	Routing              string
	SummaryPDFURL        string
	IndicativeScope      string
	IndicativeNextSteps  string
	Status               string
	CreatedAt            time.Time
	CompletedAt          *time.Time
}

// DiagnosticQuestion represents a question in the diagnostic flow.
type DiagnosticQuestion struct {
	ID              uuid.UUID
	QuestionKey     string
	QuestionText    string
	QuestionTextFR  string
	QuestionType    string
	Options         []any
	BranchingRules  map[string]any
	SortOrder       int
	IsActive        bool
}

// ScopeEstimate represents a project scope estimate.
type ScopeEstimate struct {
	ID                  uuid.UUID
	Email               string
	ProspectName        string
	Organization        string
	ServiceLine         string
	Parameters          map[string]any
	Components          []any
	WeeksBand           string
	PriceBandUSD        string
	PriceBandGHS        string
	SampleArchitecture  string
	CreatedAt           time.Time
}

// RFPSubmission represents a tender submission.
type RFPSubmission struct {
	ID                      uuid.UUID  `json:"id"`
	Organization            string     `json:"organization"`
	ContactName             string     `json:"contact_name"`
	ContactEmail            string     `json:"contact_email"`
	ContactPhone            string     `json:"contact_phone"`
	Deadline                *time.Time `json:"deadline"`
	ScopeSummary            string     `json:"scope_summary"`
	EvaluationCriteria      string     `json:"evaluation_criteria"`
	SubmissionRequirements  string     `json:"submission_requirements"`
	DocumentURL             *string    `json:"document_url"`
	Status                  string     `json:"status"`
	AssignedTo              *uuid.UUID `json:"assigned_to"`
	SLAAcknowledgedAt       *time.Time `json:"sla_acknowledged_at"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`
}

// NewsletterSubscriber represents a newsletter signup.
type NewsletterSubscriber struct {
	ID              uuid.UUID
	Email           string
	FirstName       string
	Segments        []string
	IsVerified      bool
	VerifiedAt      *time.Time
	UnsubscribedAt  *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// ConsultationBooking represents a requested consultation call.
type ConsultationBooking struct {
	ID               uuid.UUID  `json:"id"`
	Email            string     `json:"email"`
	FirstName        string     `json:"first_name"`
	LastName         string     `json:"last_name"`
	Organization     string     `json:"organization"`
	Topic            string     `json:"topic"`
	PreferredDate    *time.Time `json:"preferred_date"`
	PreferredTime    string     `json:"preferred_time"`
	DurationMinutes  int        `json:"duration_minutes"`
	Status           string     `json:"status"`
	ScheduledAt      *time.Time `json:"scheduled_at"`
	Notes            string     `json:"notes"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
