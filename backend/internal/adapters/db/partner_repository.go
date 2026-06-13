package db

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// PartnerRepo implements domain.PartnerRepository.
type PartnerRepo struct {
	pool *pgxpool.Pool
}

// NewPartnerRepo creates a new PartnerRepo.
func NewPartnerRepo(pool *pgxpool.Pool) *PartnerRepo {
	return &PartnerRepo{pool: pool}
}

func (r *PartnerRepo) CreatePartnerApplication(ctx context.Context, a *domain.PartnerApplication) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO partner.applications (org_name, org_website, contact_name, contact_email, contact_phone, partner_type,
			existing_product, domain_expertise, traction_metrics, what_they_need, what_they_bring, target_markets, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`, a.OrgName, a.OrgWebsite, a.ContactName, a.ContactEmail, a.ContactPhone, a.PartnerType,
		a.ExistingProduct, a.DomainExpertise, a.TractionMetrics, a.WhatTheyNeed, a.WhatTheyBring, a.TargetMarkets, a.Status, a.Notes)
	return err
}

func (r *PartnerRepo) ListPartnerApplications(ctx context.Context, status string) ([]domain.PartnerApplication, error) {
	query := `
		SELECT id, org_name, org_website, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone,
			partner_type::text, COALESCE(existing_product,'') AS existing_product, COALESCE(domain_expertise,'') AS domain_expertise,
			COALESCE(traction_metrics,'') AS traction_metrics, COALESCE(what_they_need,'') AS what_they_need,
			COALESCE(what_they_bring,'') AS what_they_bring, target_markets, status::text, reviewed_by, reviewed_at,
			COALESCE(notes,'') AS notes, created_at, updated_at
		FROM partner.applications
	`
	args := []any{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.PartnerApplication])
}

func (r *PartnerRepo) GetPartnerApplication(ctx context.Context, id string) (*domain.PartnerApplication, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, org_name, org_website, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone,
			partner_type::text, COALESCE(existing_product,'') AS existing_product, COALESCE(domain_expertise,'') AS domain_expertise,
			COALESCE(traction_metrics,'') AS traction_metrics, COALESCE(what_they_need,'') AS what_they_need,
			COALESCE(what_they_bring,'') AS what_they_bring, target_markets, status::text, reviewed_by, reviewed_at,
			COALESCE(notes,'') AS notes, created_at, updated_at
		FROM partner.applications WHERE id = $1
	`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	apps, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.PartnerApplication])
	if err != nil || len(apps) == 0 {
		return nil, err
	}
	return &apps[0], nil
}

func (r *PartnerRepo) UpdatePartnerApplicationStatus(ctx context.Context, id string, status string, reviewedBy string, notes string) error {
	var reviewer *uuid.UUID
	if reviewedBy != "" {
		uid, err := uuid.Parse(reviewedBy)
		if err == nil {
			reviewer = &uid
		}
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE partner.applications SET status = $1, reviewed_by = $2, reviewed_at = NOW(), notes = $3, updated_at = NOW()
		WHERE id = $4
	`, status, reviewer, notes, id)
	return err
}

func (r *PartnerRepo) CreatePartner(ctx context.Context, p *domain.Partner) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO partner.partners (application_id, org_name, org_website, contact_name, contact_email, contact_phone,
			partner_type, tier, logo_url, description, target_markets, revenue_share_pct, commission_pct, is_active, activated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`, p.ApplicationID, p.OrgName, p.OrgWebsite, p.ContactName, p.ContactEmail, p.ContactPhone,
		p.PartnerType, p.Tier, p.LogoURL, p.Description, p.TargetMarkets, p.RevenueSharePct, p.CommissionPct, p.IsActive, time.Now())
	return err
}

func (r *PartnerRepo) ListPartners(ctx context.Context, isActive bool) ([]domain.Partner, error) {
	query := `
		SELECT id, application_id, org_name, org_website, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone,
			partner_type::text, tier::text, COALESCE(logo_url,'') AS logo_url, COALESCE(description,'') AS description,
			target_markets, revenue_share_pct, commission_pct, is_active, activated_at, created_at, updated_at
		FROM partner.partners
	`
	args := []any{}
	if isActive {
		query += " WHERE is_active = TRUE"
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Partner])
}

func (r *PartnerRepo) GetPartnerByID(ctx context.Context, id string) (*domain.Partner, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, application_id, org_name, org_website, contact_name, contact_email, COALESCE(contact_phone,'') AS contact_phone,
			partner_type::text, tier::text, COALESCE(logo_url,'') AS logo_url, COALESCE(description,'') AS description,
			target_markets, revenue_share_pct, commission_pct, is_active, activated_at, created_at, updated_at
		FROM partner.partners WHERE id = $1
	`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	partners, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.Partner])
	if err != nil || len(partners) == 0 {
		return nil, err
	}
	return &partners[0], nil
}

func (r *PartnerRepo) GetPartnerByUser(ctx context.Context, userID string) (*domain.Partner, error) {
	row, err := r.pool.Query(ctx, `
		SELECT p.id, p.application_id, p.org_name, p.org_website, p.contact_name, p.contact_email, COALESCE(p.contact_phone,'') AS contact_phone,
			p.partner_type::text, p.tier::text, COALESCE(p.logo_url,'') AS logo_url, COALESCE(p.description,'') AS description,
			p.target_markets, p.revenue_share_pct, p.commission_pct, p.is_active, p.activated_at, p.created_at, p.updated_at
		FROM partner.partners p
		JOIN partner.partner_users pu ON p.id = pu.partner_id
		WHERE pu.user_id = $1 AND p.is_active = TRUE
		LIMIT 1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	partners, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.Partner])
	if err != nil || len(partners) == 0 {
		return nil, err
	}
	return &partners[0], nil
}

func (r *PartnerRepo) UpdatePartner(ctx context.Context, p *domain.Partner) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE partner.partners SET org_name = $1, org_website = $2, contact_name = $3, contact_email = $4,
			contact_phone = $5, tier = $6, logo_url = $7, description = $8, target_markets = $9,
			revenue_share_pct = $10, commission_pct = $11, is_active = $12, updated_at = NOW()
		WHERE id = $13
	`, p.OrgName, p.OrgWebsite, p.ContactName, p.ContactEmail, p.ContactPhone, p.Tier, p.LogoURL,
		p.Description, p.TargetMarkets, p.RevenueSharePct, p.CommissionPct, p.IsActive, p.ID)
	return err
}

func (r *PartnerRepo) ListPartnerProducts(ctx context.Context, partnerID string) ([]domain.PartnerProduct, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, partner_id, name, slug, COALESCE(description,'') AS description, status, COALESCE(development_stage,'') AS development_stage,
			launch_date, revenue_share_pct, COALESCE(ip_ownership_split,'') AS ip_ownership_split, created_at, updated_at
		FROM partner.products WHERE partner_id = $1 ORDER BY created_at DESC
	`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.PartnerProduct])
}

func (r *PartnerRepo) GetPartnerProduct(ctx context.Context, id string) (*domain.PartnerProduct, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, partner_id, name, slug, COALESCE(description,'') AS description, status, COALESCE(development_stage,'') AS development_stage,
			launch_date, revenue_share_pct, COALESCE(ip_ownership_split,'') AS ip_ownership_split, created_at, updated_at
		FROM partner.products WHERE id = $1
	`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	products, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.PartnerProduct])
	if err != nil || len(products) == 0 {
		return nil, err
	}
	return &products[0], nil
}

func (r *PartnerRepo) ListPartnerAgreements(ctx context.Context, partnerID string) ([]domain.PartnerAgreement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, partner_id, title, COALESCE(document_url,'') AS document_url, signed_at, expires_at,
			COALESCE(terms,'{}') AS terms, created_at
		FROM partner.agreements WHERE partner_id = $1 ORDER BY created_at DESC
	`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agreements []domain.PartnerAgreement
	for rows.Next() {
		var a domain.PartnerAgreement
		var terms []byte
		if err := rows.Scan(&a.ID, &a.PartnerID, &a.Title, &a.DocumentURL, &a.SignedAt, &a.ExpiresAt, &terms, &a.CreatedAt); err != nil {
			continue
		}
		_ = json.Unmarshal(terms, &a.Terms)
		if a.Terms == nil {
			a.Terms = map[string]any{}
		}
		agreements = append(agreements, a)
	}
	return agreements, rows.Err()
}

func (r *PartnerRepo) ListReferrals(ctx context.Context, partnerID string) ([]domain.Referral, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, partner_id, referred_org_name, COALESCE(referred_contact_name,'') AS referred_contact_name,
			COALESCE(referred_contact_email,'') AS referred_contact_email, COALESCE(referred_contact_phone,'') AS referred_contact_phone,
			opportunity_value, status::text, converted_at, commission_amount, COALESCE(notes,'') AS notes, created_at, updated_at
		FROM partner.referrals WHERE partner_id = $1 ORDER BY created_at DESC
	`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Referral])
}

func (r *PartnerRepo) CreateReferral(ctx context.Context, ref *domain.Referral) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO partner.referrals (partner_id, referred_org_name, referred_contact_name, referred_contact_email,
			referred_contact_phone, opportunity_value, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, ref.PartnerID, ref.ReferredOrgName, ref.ReferredContactName, ref.ReferredContactEmail,
		ref.ReferredContactPhone, ref.OpportunityValue, ref.Status, ref.Notes)
	return err
}

func (r *PartnerRepo) UpdateReferralStatus(ctx context.Context, id string, status string, commissionAmount *float64) error {
	var convertedAt *time.Time
	if status == "converted" {
		t := time.Now()
		convertedAt = &t
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE partner.referrals SET status = $1, converted_at = $2, commission_amount = $3, updated_at = NOW()
		WHERE id = $4
	`, status, convertedAt, commissionAmount, id)
	return err
}

func (r *PartnerRepo) ListDistributionOrders(ctx context.Context, partnerID string) ([]domain.DistributionOrder, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, partner_id, product_id, COALESCE(order_ref,'') AS order_ref, COALESCE(customer_name,'') AS customer_name,
			COALESCE(customer_email,'') AS customer_email, quantity, unit_price, total_value, commission_amount, status, created_at, updated_at
		FROM partner.distribution_orders WHERE partner_id = $1 ORDER BY created_at DESC
	`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.DistributionOrder])
}

func (r *PartnerRepo) GetPartnerUser(ctx context.Context, userID string) (*domain.PartnerUser, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, partner_id, user_id, role, created_at
		FROM partner.partner_users WHERE user_id = $1
		LIMIT 1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	users, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.PartnerUser])
	if err != nil || len(users) == 0 {
		return nil, err
	}
	return &users[0], nil
}
