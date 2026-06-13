package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// PortalConfigRepo implements portal configuration storage.
type PortalConfigRepo struct {
	pool *pgxpool.Pool
}

// NewPortalConfigRepo creates a new PortalConfigRepo.
func NewPortalConfigRepo(pool *pgxpool.Pool) *PortalConfigRepo {
	return &PortalConfigRepo{pool: pool}
}

func (r *PortalConfigRepo) GetClientThemeByEngagement(ctx context.Context, engagementID string) (*domain.ClientTheme, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, engagement_id, client_name, primary_color, COALESCE(secondary_color,'') AS secondary_color, COALESCE(logo_url,'') AS logo_url, COALESCE(favicon_url,'') AS favicon_url, COALESCE(email_from_name,'') AS email_from_name, COALESCE(email_from_address,'') AS email_from_address, COALESCE(custom_css,'') AS custom_css, is_active, created_at, updated_at
		FROM portal_config.client_themes WHERE engagement_id = $1 AND is_active = TRUE
	`, engagementID)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	themes, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.ClientTheme])
	if err != nil || len(themes) == 0 {
		return nil, err
	}
	return &themes[0], nil
}

func (r *PortalConfigRepo) UpsertClientTheme(ctx context.Context, t *domain.ClientTheme) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO portal_config.client_themes (id, engagement_id, client_name, primary_color, secondary_color, logo_url, favicon_url, email_from_name, email_from_address, custom_css, is_active, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
		ON CONFLICT (engagement_id) DO UPDATE SET
			client_name = EXCLUDED.client_name,
			primary_color = EXCLUDED.primary_color,
			secondary_color = EXCLUDED.secondary_color,
			logo_url = EXCLUDED.logo_url,
			favicon_url = EXCLUDED.favicon_url,
			email_from_name = EXCLUDED.email_from_name,
			email_from_address = EXCLUDED.email_from_address,
			custom_css = EXCLUDED.custom_css,
			is_active = EXCLUDED.is_active,
			updated_at = NOW()
	`, t.ID, t.EngagementID, t.ClientName, t.PrimaryColor, t.SecondaryColor, t.LogoURL, t.FaviconURL, t.EmailFromName, t.EmailFromAddress, t.CustomCSS, t.IsActive)
	return err
}
