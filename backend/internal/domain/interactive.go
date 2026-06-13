package domain

import (
	"time"

	"github.com/google/uuid"
)

// ChatSession represents a conversation with the AI Concierge.
type ChatSession struct {
	ID          uuid.UUID
	UserID      *uuid.UUID
	VisitorID   string
	Source      string
	Status      string
	Subject     string
	EscalatedTo *uuid.UUID
	EscalatedAt *time.Time
	ClosedAt    *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// ChatMessage represents a single message in a chat session.
type ChatMessage struct {
	ID        uuid.UUID
	SessionID uuid.UUID
	Role      string
	Content   string
	Metadata  map[string]any
	CreatedAt time.Time
}

// KnowledgeBaseEntry represents a curated Q&A for the concierge.
type KnowledgeBaseEntry struct {
	ID              uuid.UUID
	Category        string
	QuestionPattern string
	Answer          string
	RelatedSlugs    []string
	Priority        int
	IsActive        bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// ConciergeResponse is the structured response from the concierge engine.
type ConciergeResponse struct {
	Answer      string   `json:"answer"`
	RelatedPages []string `json:"related_pages,omitempty"`
	Confidence  float64  `json:"confidence"`
	Escalate    bool     `json:"escalate"`
}

// AssessmentTemplate defines a readiness assessment configuration.
type AssessmentTemplate struct {
	ID          uuid.UUID `json:"id"`
	Slug        string    `json:"slug"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Version     int       `json:"version"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// AssessmentQuestion is a single question within a template.
type AssessmentQuestion struct {
	ID       uuid.UUID        `json:"id"`
	TemplateID uuid.UUID      `json:"template_id"`
	QuestionText string       `json:"question_text"`
	Dimension string          `json:"dimension"`
	QuestionOrder int         `json:"question_order"`
	Options  []AssessmentOption `json:"options"`
	CreatedAt time.Time       `json:"created_at"`
}

// AssessmentOption is a selectable answer for a question.
type AssessmentOption struct {
	Label  string  `json:"label"`
	Value  int     `json:"value"`
	Weight float64 `json:"weight"`
}

// AssessmentSession tracks a user's progress through an assessment.
type AssessmentSession struct {
	ID                    uuid.UUID      `json:"id"`
	TemplateID            uuid.UUID      `json:"template_id"`
	Email                 string         `json:"email"`
	Organization          string         `json:"organization"`
	Status                string         `json:"status"`
	Answers               []AnswerEntry  `json:"answers"`
	Scores                map[string]int `json:"scores"`
	OverallScore          int            `json:"overall_score"`
	RecommendationSummary string         `json:"recommendation_summary"`
	CreatedAt             time.Time      `json:"created_at"`
	CompletedAt           *time.Time     `json:"completed_at"`
}

// AnswerEntry records a single answer in a session.
type AnswerEntry struct {
	QuestionID uuid.UUID `json:"question_id"`
	Value      int       `json:"value"`
}
