package db

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// IdentityRepo implements authentication and identity storage.
type IdentityRepo struct {
	pool *pgxpool.Pool
}

// NewIdentityRepo creates a new IdentityRepo.
func NewIdentityRepo(pool *pgxpool.Pool) *IdentityRepo {
	return &IdentityRepo{pool: pool}
}

// --- Users ---

func (r *IdentityRepo) CreateUser(ctx context.Context, u *domain.User) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.users (id, email, password_hash, first_name, last_name, avatar_url, role, is_active, email_verified_at, mfa_enabled, mfa_secret, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
	`, u.ID, u.Email, u.PasswordHash, u.FirstName, u.LastName, u.AvatarURL, u.Role, u.IsActive, u.EmailVerifiedAt, u.MFAEnabled, u.MFASecret)
	return err
}

func (r *IdentityRepo) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, first_name, last_name, COALESCE(avatar_url,'') AS avatar_url, role, is_active, email_verified_at, last_login_at, mfa_enabled, COALESCE(mfa_secret,'') AS mfa_secret, created_at, updated_at
		FROM identity.users WHERE email = $1
	`, email)
	u := &domain.User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.AvatarURL, &u.Role, &u.IsActive, &u.EmailVerifiedAt, &u.LastLoginAt, &u.MFAEnabled, &u.MFASecret, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *IdentityRepo) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, email, password_hash, first_name, last_name, COALESCE(avatar_url,'') AS avatar_url, role, is_active, email_verified_at, last_login_at, mfa_enabled, COALESCE(mfa_secret,'') AS mfa_secret, created_at, updated_at
		FROM identity.users WHERE id = $1
	`, id)
	u := &domain.User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.AvatarURL, &u.Role, &u.IsActive, &u.EmailVerifiedAt, &u.LastLoginAt, &u.MFAEnabled, &u.MFASecret, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *IdentityRepo) UpdateLastLogin(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE identity.users SET last_login_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *IdentityRepo) EnableMFA(ctx context.Context, id, secret string) error {
	_, err := r.pool.Exec(ctx, `UPDATE identity.users SET mfa_enabled = TRUE, mfa_secret = $1 WHERE id = $2`, secret, id)
	return err
}

func (r *IdentityRepo) UpdateUser(ctx context.Context, id string, firstName, lastName, email string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.users SET first_name = $2, last_name = $3, email = $4, updated_at = NOW() WHERE id = $1
	`, id, firstName, lastName, email)
	return err
}

// --- Sessions ---

func (r *IdentityRepo) CreateSession(ctx context.Context, s *domain.Session) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.sessions (id, user_id, refresh_token_hash, ip_address, user_agent, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`, s.ID, s.UserID, s.RefreshTokenHash, s.IPAddress, s.UserAgent, s.ExpiresAt)
	return err
}

func (r *IdentityRepo) GetSessionByRefreshToken(ctx context.Context, hash string) (*domain.Session, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, refresh_token_hash, ip_address, user_agent, expires_at, created_at
		FROM identity.sessions WHERE refresh_token_hash = $1 AND expires_at > NOW()
	`, hash)
	s := &domain.Session{}
	err := row.Scan(&s.ID, &s.UserID, &s.RefreshTokenHash, &s.IPAddress, &s.UserAgent, &s.ExpiresAt, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *IdentityRepo) RevokeSession(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM identity.sessions WHERE id = $1`, id)
	return err
}

func (r *IdentityRepo) RevokeAllUserSessions(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM identity.sessions WHERE user_id = $1`, userID)
	return err
}

func (r *IdentityRepo) ListUserSessions(ctx context.Context, userID string) ([]domain.Session, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, refresh_token_hash, COALESCE(ip_address::text,'') AS ip_address, COALESCE(user_agent,'') AS user_agent, expires_at, created_at
		FROM identity.sessions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Session])
}

// --- Audit Log ---

func (r *IdentityRepo) CreateAuditLog(ctx context.Context, a *domain.AuditLog) error {
	metadataJSON, _ := json.Marshal(a.Metadata)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.audit_log (id, user_id, action, resource, resource_id, ip_address, user_agent, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`, a.ID, a.UserID, a.Action, a.Resource, a.ResourceID, a.IPAddress, a.UserAgent, metadataJSON)
	return err
}

func (r *IdentityRepo) ListAuditLogs(ctx context.Context, userID string, limit int) ([]domain.AuditLog, error) {
	var uid interface{}
	if userID != "" {
		if parsed, err := uuid.Parse(userID); err == nil {
			uid = parsed
		}
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, action, resource, COALESCE(resource_id::text,'') AS resource_id, COALESCE(ip_address::text,'') AS ip_address, COALESCE(user_agent,'') AS user_agent, COALESCE(metadata, '{}'::jsonb) AS metadata, created_at
		FROM identity.audit_log
		WHERE ($1::uuid IS NULL OR user_id = $1)
		ORDER BY created_at DESC
		LIMIT $2
	`, uid, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.AuditLog])
}

// --- Permissions ---

func (r *IdentityRepo) GetPermissionsForRole(ctx context.Context, role string) ([]domain.Permission, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.resource, p.action, COALESCE(p.description,'') AS description
		FROM identity.permissions p
		JOIN identity.role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role = $1
	`, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.Permission])
}

func (r *IdentityRepo) SeedPermissions(ctx context.Context) error {
	perms := []struct {
		Resource string
		Action   string
		Desc     string
	}{
		{"engagement", "read", "Read engagement data"},
		{"engagement", "write", "Write engagement data"},
		{"engagement", "admin", "Administer engagement"},
		{"deliverable", "read", "Read deliverables"},
		{"deliverable", "write", "Write deliverables"},
		{"deliverable", "approve", "Approve deliverables"},
		{"decision", "read", "Read decisions"},
		{"decision", "write", "Write decisions"},
		{"risk", "read", "Read risks"},
		{"risk", "write", "Write risks"},
		{"invoice", "read", "Read invoices"},
		{"invoice", "pay", "Pay invoices"},
		{"user", "read", "Read users"},
		{"user", "write", "Manage users"},
	}

	for _, p := range perms {
		_, err := r.pool.Exec(ctx, `
			INSERT INTO identity.permissions (id, resource, action, description)
			VALUES (gen_random_uuid(), $1, $2, $3)
			ON CONFLICT (resource, action) DO NOTHING
		`, p.Resource, p.Action, p.Desc)
		if err != nil {
			return err
		}
	}

	// Seed role permissions
	rolePerms := map[string][]string{
		"admin":    {"engagement:admin", "engagement:write", "engagement:read", "deliverable:write", "deliverable:read", "decision:write", "decision:read", "risk:write", "risk:read", "invoice:read", "invoice:pay", "user:write", "user:read"},
		"executive": {"engagement:read", "deliverable:read", "decision:read", "risk:read", "invoice:read", "user:read"},
		"project":  {"engagement:read", "engagement:write", "deliverable:read", "deliverable:write", "decision:read", "decision:write", "risk:read", "risk:write", "invoice:read", "user:read"},
		"viewer":   {"engagement:read", "deliverable:read", "decision:read", "risk:read"},
	}

	for role, actions := range rolePerms {
		for _, action := range actions {
			parts := strings.Split(action, ":")
			if len(parts) != 2 {
				continue
			}
			_, err := r.pool.Exec(ctx, `
				INSERT INTO identity.role_permissions (role, permission_id)
				SELECT $1, id FROM identity.permissions WHERE resource = $2 AND action = $3
				ON CONFLICT DO NOTHING
			`, role, parts[0], parts[1])
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *IdentityRepo) CreateAPIKey(ctx context.Context, k *domain.APIKey) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.api_keys (user_id, name, key_hash, key_prefix, scopes, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, k.UserID, k.Name, k.KeyHash, k.KeyPrefix, k.Scopes, k.ExpiresAt)
	return err
}

func (r *IdentityRepo) GetAPIKeyByHash(ctx context.Context, hash string) (*domain.APIKey, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, user_id, name, key_hash, key_prefix, scopes, expires_at, last_used_at, is_active, created_at, revoked_at
		FROM identity.api_keys WHERE key_hash = $1 AND is_active = TRUE
	`, hash)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	keys, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.APIKey])
	if err != nil || len(keys) == 0 {
		return nil, err
	}
	return &keys[0], nil
}

func (r *IdentityRepo) ListAPIKeysByUser(ctx context.Context, userID string) ([]domain.APIKey, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, name, key_hash, key_prefix, scopes, expires_at, last_used_at, is_active, created_at, revoked_at
		FROM identity.api_keys WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return pgx.CollectRows(rows, pgx.RowToStructByName[domain.APIKey])
}

func (r *IdentityRepo) RevokeAPIKey(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.api_keys SET is_active = FALSE, revoked_at = NOW() WHERE id = $1
	`, id)
	return err
}

func (r *IdentityRepo) UpdateAPIKeyLastUsed(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.api_keys SET last_used_at = NOW() WHERE id = $1
	`, id)
	return err
}

// --- Password Reset ---

func (r *IdentityRepo) CreatePasswordResetToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.password_reset_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, tokenHash, expiresAt)
	return err
}

func (r *IdentityRepo) GetPasswordResetToken(ctx context.Context, tokenHash string) (*domain.PasswordResetToken, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, user_id, token_hash, expires_at, used_at, created_at
		FROM identity.password_reset_tokens
		WHERE token_hash = $1
	`, tokenHash)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	tokens, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.PasswordResetToken])
	if err != nil || len(tokens) == 0 {
		return nil, err
	}
	return &tokens[0], nil
}

func (r *IdentityRepo) MarkPasswordResetTokenUsed(ctx context.Context, tokenHash string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.password_reset_tokens SET used_at = NOW() WHERE token_hash = $1
	`, tokenHash)
	return err
}

func (r *IdentityRepo) UpdateUserPassword(ctx context.Context, userID string, passwordHash string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.users SET password_hash = $1, updated_at = NOW() WHERE id = $2
	`, passwordHash, userID)
	return err
}

// --- Email Verification ---

func (r *IdentityRepo) CreateEmailVerificationToken(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.email_verification_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, tokenHash, expiresAt)
	return err
}

func (r *IdentityRepo) GetEmailVerificationToken(ctx context.Context, tokenHash string) (*domain.EmailVerificationToken, error) {
	row, err := r.pool.Query(ctx, `
		SELECT id, user_id, token_hash, expires_at, used_at, created_at
		FROM identity.email_verification_tokens
		WHERE token_hash = $1
	`, tokenHash)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	tokens, err := pgx.CollectRows(row, pgx.RowToStructByName[domain.EmailVerificationToken])
	if err != nil || len(tokens) == 0 {
		return nil, err
	}
	return &tokens[0], nil
}

func (r *IdentityRepo) MarkEmailVerificationTokenUsed(ctx context.Context, tokenHash string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.email_verification_tokens SET used_at = NOW() WHERE token_hash = $1
	`, tokenHash)
	return err
}

func (r *IdentityRepo) VerifyUserEmail(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1
	`, userID)
	return err
}
