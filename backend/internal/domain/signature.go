package domain

import (
	"time"

	"github.com/google/uuid"
)

// SignatureRequest tracks a document awaiting e-signature.
type SignatureRequest struct {
	ID                uuid.UUID  `json:"id"`
	DocumentType      string     `json:"document_type"`
	EngagementID      *uuid.UUID `json:"engagement_id"`
	RecipientEmail    string     `json:"recipient_email"`
	RecipientName     string     `json:"recipient_name"`
	RecipientOrg      string     `json:"recipient_org"`
	DocumentTitle     string     `json:"document_title"`
	DocumentBody      string     `json:"document_body"`
	ExternalProvider  string     `json:"external_provider"`
	ExternalRequestID string     `json:"external_request_id"`
	SigningURL        string     `json:"signing_url"`
	Status            string     `json:"status"`
	SignedAt          *time.Time `json:"signed_at"`
	SignedDocumentURL string     `json:"signed_document_url"`
	CreatedBy         uuid.UUID  `json:"created_by"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	ExpiresAt         *time.Time `json:"expires_at"`
}
