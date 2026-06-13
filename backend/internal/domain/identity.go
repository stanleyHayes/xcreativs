package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents an authenticated user.
type User struct {
	ID              uuid.UUID
	Email           string
	PasswordHash    string
	FirstName       string
	LastName        string
	AvatarURL       string
	Role            string
	IsActive        bool
	EmailVerifiedAt *time.Time
	LastLoginAt     *time.Time
	MFAEnabled      bool
	MFASecret       string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Session represents a refresh token session.
type Session struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	RefreshTokenHash string
	IPAddress        string
	UserAgent        string
	ExpiresAt        time.Time
	CreatedAt        time.Time
}

// AuditLog represents an audit trail entry.
type AuditLog struct {
	ID         uuid.UUID
	UserID     *uuid.UUID
	Action     string
	Resource   string
	ResourceID string
	IPAddress  string
	UserAgent  string
	Metadata   map[string]any
	CreatedAt  time.Time
}

// Permission represents a granular permission.
type Permission struct {
	ID          uuid.UUID
	Resource    string
	Action      string
	Description string
}

// RolePermission maps roles to permissions.
type RolePermission struct {
	Role         string
	PermissionID uuid.UUID
}

// APIKey represents a scoped API key for client data access.
type APIKey struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Name        string
	KeyHash     string
	KeyPrefix   string
	Scopes      []string
	ExpiresAt   *time.Time
	LastUsedAt  *time.Time
	IsActive    bool
	CreatedAt   time.Time
	RevokedAt   *time.Time
}

// PasswordResetToken represents a password reset token.
type PasswordResetToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

// IsValid returns true if the token has not expired and has not been used.
func (t *PasswordResetToken) IsValid() bool {
	return t.UsedAt == nil && time.Now().Before(t.ExpiresAt)
}

// EmailVerificationToken represents an email verification token.
type EmailVerificationToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
	CreatedAt time.Time
}

// IsValid returns true if the token has not expired and has not been used.
func (t *EmailVerificationToken) IsValid() bool {
	return t.UsedAt == nil && time.Now().Before(t.ExpiresAt)
}
