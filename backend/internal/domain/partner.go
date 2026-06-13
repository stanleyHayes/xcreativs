package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// PartnerApplication represents a partnership application from a prospective partner.
type PartnerApplication struct {
	ID              uuid.UUID
	OrgName         string
	OrgWebsite      string
	ContactName     string
	ContactEmail    string
	ContactPhone    string
	PartnerType     string
	ExistingProduct string
	DomainExpertise string
	TractionMetrics string
	WhatTheyNeed    string
	WhatTheyBring   string
	TargetMarkets   []string
	Status          string
	ReviewedBy      *uuid.UUID
	ReviewedAt      *time.Time
	Notes           string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Partner represents an active partner.
type Partner struct {
	ID              uuid.UUID
	ApplicationID   *uuid.UUID
	OrgName         string
	OrgWebsite      string
	ContactName     string
	ContactEmail    string
	ContactPhone    string
	PartnerType     string
	Tier            string
	LogoURL         string
	Description     string
	TargetMarkets   []string
	RevenueSharePct *float64
	CommissionPct   *float64
	IsActive        bool
	ActivatedAt     *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// PartnerProduct represents a co-owned product with a partner.
type PartnerProduct struct {
	ID                uuid.UUID
	PartnerID         uuid.UUID
	Name              string
	Slug              string
	Description       string
	Status            string
	DevelopmentStage  string
	LaunchDate        *time.Time
	RevenueSharePct   *float64
	IPOwnershipSplit  string
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// PartnerAgreement represents a partnership agreement.
type PartnerAgreement struct {
	ID         uuid.UUID
	PartnerID  uuid.UUID
	Title      string
	DocumentURL string
	SignedAt   *time.Time
	ExpiresAt  *time.Time
	Terms      map[string]any
	CreatedAt  time.Time
}

// Referral represents a referral tracked for a partner.
type Referral struct {
	ID                  uuid.UUID
	PartnerID           uuid.UUID
	ReferredOrgName     string
	ReferredContactName string
	ReferredContactEmail string
	ReferredContactPhone string
	OpportunityValue    *float64
	Status              string
	ConvertedAt         *time.Time
	CommissionAmount    *float64
	Notes               string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

// DistributionOrder represents a distribution order for a partner.
type DistributionOrder struct {
	ID               uuid.UUID
	PartnerID        uuid.UUID
	ProductID        *uuid.UUID
	OrderRef         string
	CustomerName     string
	CustomerEmail    string
	Quantity         *int
	UnitPrice        *float64
	TotalValue       *float64
	CommissionAmount *float64
	Status           string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// PartnerUser links an identity user to a partner.
type PartnerUser struct {
	ID        uuid.UUID
	PartnerID uuid.UUID
	UserID    uuid.UUID
	Role      string
	CreatedAt time.Time
}

// PartnerRepository defines storage for partner layer.
type PartnerRepository interface {
	// Applications
	CreatePartnerApplication(ctx context.Context, a *PartnerApplication) error
	ListPartnerApplications(ctx context.Context, status string) ([]PartnerApplication, error)
	GetPartnerApplication(ctx context.Context, id string) (*PartnerApplication, error)
	UpdatePartnerApplicationStatus(ctx context.Context, id string, status string, reviewedBy string, notes string) error

	// Partners
	CreatePartner(ctx context.Context, p *Partner) error
	ListPartners(ctx context.Context, isActive bool) ([]Partner, error)
	GetPartnerByID(ctx context.Context, id string) (*Partner, error)
	GetPartnerByUser(ctx context.Context, userID string) (*Partner, error)
	UpdatePartner(ctx context.Context, p *Partner) error

	// Products
	ListPartnerProducts(ctx context.Context, partnerID string) ([]PartnerProduct, error)
	GetPartnerProduct(ctx context.Context, id string) (*PartnerProduct, error)

	// Agreements
	ListPartnerAgreements(ctx context.Context, partnerID string) ([]PartnerAgreement, error)

	// Referrals
	ListReferrals(ctx context.Context, partnerID string) ([]Referral, error)
	CreateReferral(ctx context.Context, r *Referral) error
	UpdateReferralStatus(ctx context.Context, id string, status string, commissionAmount *float64) error

	// Distribution Orders
	ListDistributionOrders(ctx context.Context, partnerID string) ([]DistributionOrder, error)

	// Partner Users
	GetPartnerUser(ctx context.Context, userID string) (*PartnerUser, error)
}
