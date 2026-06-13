package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// SignatureRepo implements signature request storage.
type SignatureRepo struct {
	pool *pgxpool.Pool
}

// NewSignatureRepo creates a new SignatureRepo.
func NewSignatureRepo(pool *pgxpool.Pool) *SignatureRepo {
	return &SignatureRepo{pool: pool}
}

func (r *SignatureRepo) CreateSignatureRequest(ctx context.Context, s *domain.SignatureRequest) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO lead_qual.signature_requests (id, document_type, engagement_id, recipient_email, recipient_name, recipient_org, document_title, document_body, external_provider, external_request_id, signing_url, status, expires_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`, s.ID, s.DocumentType, s.EngagementID, s.RecipientEmail, s.RecipientName, s.RecipientOrg, s.DocumentTitle, s.DocumentBody, s.ExternalProvider, s.ExternalRequestID, s.SigningURL, s.Status, s.ExpiresAt, s.CreatedBy)
	return err
}

func (r *SignatureRepo) ListSignatureRequests(ctx context.Context, status string, userID string) ([]domain.SignatureRequest, error) {
	query := `
		SELECT id, document_type, engagement_id, recipient_email, COALESCE(recipient_name,'') AS recipient_name, COALESCE(recipient_org,'') AS recipient_org, document_title, document_body, external_provider, COALESCE(external_request_id,'') AS external_request_id, COALESCE(signing_url,'') AS signing_url, status, signed_at, COALESCE(signed_document_url,'') AS signed_document_url, created_by, created_at, updated_at, expires_at
		FROM lead_qual.signature_requests
		WHERE ($1 = '' OR status = $1) AND ($2 = '' OR created_by::text = $2)
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, status, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.SignatureRequest
	for rows.Next() {
		var s domain.SignatureRequest
		if err := rows.Scan(
			&s.ID, &s.DocumentType, &s.EngagementID, &s.RecipientEmail, &s.RecipientName, &s.RecipientOrg,
			&s.DocumentTitle, &s.DocumentBody, &s.ExternalProvider, &s.ExternalRequestID, &s.SigningURL,
			&s.Status, &s.SignedAt, &s.SignedDocumentURL, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt, &s.ExpiresAt,
		); err != nil {
			return nil, fmt.Errorf("scan signature request: %w", err)
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

func (r *SignatureRepo) GetSignatureRequest(ctx context.Context, id string) (*domain.SignatureRequest, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, document_type, engagement_id, recipient_email, COALESCE(recipient_name,'') AS recipient_name, COALESCE(recipient_org,'') AS recipient_org, document_title, document_body, external_provider, COALESCE(external_request_id,'') AS external_request_id, COALESCE(signing_url,'') AS signing_url, status, signed_at, COALESCE(signed_document_url,'') AS signed_document_url, created_by, created_at, updated_at, expires_at
		FROM lead_qual.signature_requests WHERE id = $1
	`, id)
	var s domain.SignatureRequest
	err := row.Scan(
		&s.ID, &s.DocumentType, &s.EngagementID, &s.RecipientEmail, &s.RecipientName, &s.RecipientOrg,
		&s.DocumentTitle, &s.DocumentBody, &s.ExternalProvider, &s.ExternalRequestID, &s.SigningURL,
		&s.Status, &s.SignedAt, &s.SignedDocumentURL, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt, &s.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SignatureRepo) SendSignatureRequest(ctx context.Context, id string, signingURL string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.signature_requests SET status = 'sent', signing_url = $1, expires_at = $2, updated_at = NOW() WHERE id = $3
	`, signingURL, expiresAt, id)
	return err
}

func (r *SignatureRepo) UpdateSignatureStatus(ctx context.Context, id string, status string, signedDocumentURL string) error {
	if status == "signed" {
		_, err := r.pool.Exec(ctx, `
			UPDATE lead_qual.signature_requests SET status = $1, signed_document_url = $2, signed_at = NOW(), updated_at = NOW() WHERE id = $3
		`, status, signedDocumentURL, id)
		return err
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE lead_qual.signature_requests SET status = $1, signed_document_url = $2, updated_at = NOW() WHERE id = $3
	`, status, signedDocumentURL, id)
	return err
}
