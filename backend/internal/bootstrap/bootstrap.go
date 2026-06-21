// Package bootstrap runs one-time startup tasks against the database: applying
// embedded migrations and (optionally) seeding admin users from configuration.
// This exists because the production image is distroless — there is no migrate
// CLI or psql available, so these tasks must run from inside the binary.
package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"xcreatives.com/backend/migrations"
	"xcreatives.com/backend/seeds"
)

// contentSeedOrder is the apply order for the embedded content seeds (mirrors
// the Makefile `seed` target). Order matters — later files may reference rows
// created by earlier ones.
var contentSeedOrder = []string{
	"seed.sql",
	"seed_layer_six.sql",
	"seed_assessment.sql",
	"seed_ai_maturity.sql",
	"seed_phase_b.sql",
}

// SeedContent applies the embedded content seeds, but only when content.pages is
// empty — the seeds are not all idempotent, so this runs exactly once on a fresh
// database. Returns true if seeding was performed.
func SeedContent(ctx context.Context, pool *pgxpool.Pool) (bool, error) {
	var n int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM content.pages`).Scan(&n); err != nil {
		return false, fmt.Errorf("check content.pages: %w", err)
	}
	if n > 0 {
		return false, nil // already seeded
	}
	for _, name := range contentSeedOrder {
		sql, err := seeds.FS.ReadFile(name)
		if err != nil {
			return false, fmt.Errorf("read seed %s: %w", name, err)
		}
		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			return false, fmt.Errorf("apply seed %s: %w", name, err)
		}
	}
	return true, nil
}

// RunStartup performs optional one-time startup tasks gated by environment
// variables: RUN_MIGRATIONS=true applies embedded migrations, and SEED_ADMINS
// ("email:password,...") upserts admin users. Failures are logged, not fatal —
// the service still boots so /healthz stays up and the issue is diagnosable.
func RunStartup(ctx context.Context, log *slog.Logger, pool *pgxpool.Pool, dbURL string) {
	if os.Getenv("RUN_MIGRATIONS") == "true" {
		if err := RunMigrations(dbURL); err != nil {
			log.Error("auto-migration failed", "error", err)
		} else {
			log.Info("migrations applied")
		}
	}
	if spec := os.Getenv("SEED_ADMINS"); spec != "" {
		if n, err := SeedAdmins(ctx, pool, spec); err != nil {
			log.Error("admin seed failed", "error", err)
		} else if n > 0 {
			log.Info("admin users seeded", "count", n)
		}
	}
	if os.Getenv("RUN_SEED") == "true" {
		if seeded, err := SeedContent(ctx, pool); err != nil {
			log.Error("content seed failed", "error", err)
		} else if seeded {
			log.Info("content seeded")
		}
	}
}

// RunMigrations applies all pending migrations using the embedded SQL files.
// It is a no-op error (nil) when the database is already up to date.
func RunMigrations(dbURL string) error {
	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("migration source: %w", err)
	}

	// golang-migrate's pgx/v5 driver is registered under the "pgx5" scheme.
	u := dbURL
	switch {
	case strings.HasPrefix(u, "postgresql://"):
		u = "pgx5://" + strings.TrimPrefix(u, "postgresql://")
	case strings.HasPrefix(u, "postgres://"):
		u = "pgx5://" + strings.TrimPrefix(u, "postgres://")
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, u)
	if err != nil {
		return fmt.Errorf("migrate init: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrate up: %w", err)
	}
	return nil
}

// SeedAdmins upserts admin users from a spec string formatted as
// "email:password,email:password". Passwords are bcrypt-hashed here, so no
// plaintext or hashes need to live in the repository. Re-running is safe
// (idempotent upsert) and returns the number of accounts processed.
func SeedAdmins(ctx context.Context, pool *pgxpool.Pool, spec string) (int, error) {
	count := 0
	for _, pair := range strings.Split(spec, ",") {
		pair = strings.TrimSpace(pair)
		if pair == "" {
			continue
		}
		sep := strings.Index(pair, ":")
		if sep < 0 {
			return count, fmt.Errorf("invalid SEED_ADMINS entry (want email:password)")
		}
		email := strings.ToLower(strings.TrimSpace(pair[:sep]))
		password := pair[sep+1:]
		if email == "" || password == "" {
			continue
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return count, fmt.Errorf("hash password for %s: %w", email, err)
		}

		first := email
		if at := strings.Index(email, "@"); at > 0 {
			first = email[:at]
		}

		_, err = pool.Exec(ctx, `
			INSERT INTO identity.users
			  (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
			VALUES ($1, $2, $3, 'Admin', 'admin', TRUE, NOW())
			ON CONFLICT (email) DO UPDATE SET
			  password_hash     = EXCLUDED.password_hash,
			  role              = 'admin',
			  is_active         = TRUE,
			  email_verified_at = COALESCE(identity.users.email_verified_at, NOW()),
			  updated_at        = NOW()
		`, email, string(hash), first)
		if err != nil {
			return count, fmt.Errorf("upsert admin %s: %w", email, err)
		}
		count++
	}
	return count, nil
}
