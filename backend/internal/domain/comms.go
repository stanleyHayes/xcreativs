package domain

import (
	"time"

	"github.com/google/uuid"
)

// Thread represents a discussion thread.
type Thread struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	ParentType   string
	ParentID     uuid.UUID
	Title        string
	CreatedBy    *uuid.UUID
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Comment represents a thread comment.
type Comment struct {
	ID        uuid.UUID
	ThreadID  uuid.UUID
	AuthorID  *uuid.UUID
	AuthorName string
	Body      string
	CreatedAt time.Time
}

// Notification represents a user notification.
type Notification struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	EngagementID     *uuid.UUID `json:"engagement_id"`
	Title            string     `json:"title"`
	Body             string     `json:"body"`
	NotificationType string     `json:"notification_type"`
	Channel          string     `json:"channel"`
	IsRead           bool       `json:"is_read"`
	SentAt           *time.Time `json:"sent_at"`
	CreatedAt        time.Time  `json:"created_at"`
}

// ActivityFeedItem represents a single activity log entry.
type ActivityFeedItem struct {
	ID           uuid.UUID
	EngagementID uuid.UUID
	ActorID      *uuid.UUID
	ActorName    string
	Action       string
	ResourceType string
	ResourceID   string
	Metadata     map[string]any
	CreatedAt    time.Time
}
