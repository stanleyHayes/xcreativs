package domain

import (
	"time"

	"github.com/google/uuid"
)

// ClientTheme represents white-label configuration for a client portal.
type ClientTheme struct {
	ID               uuid.UUID `json:"id"`
	EngagementID     uuid.UUID `json:"engagement_id"`
	ClientName       string    `json:"client_name"`
	PrimaryColor     string    `json:"primary_color"`
	SecondaryColor   string    `json:"secondary_color"`
	LogoURL          string    `json:"logo_url"`
	FaviconURL       string    `json:"favicon_url"`
	EmailFromName    string    `json:"email_from_name"`
	EmailFromAddress string    `json:"email_from_address"`
	CustomCSS        string    `json:"custom_css"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
