//go:build integration

// Integration tests run a real Postgres via testcontainers, apply every
// migration, and exercise the repositories against the real schema — the
// coverage that catches column/NULL-scan regressions.
//
// Run with:  go test -tags=integration ./internal/adapters/db/...
package db_test

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"xcreatives.com/backend/internal/adapters/db"
)

func startPostgres(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()
	container, err := tcpostgres.Run(ctx, "postgres:16-alpine",
		tcpostgres.WithDatabase("xc"),
		tcpostgres.WithUsername("xc"),
		tcpostgres.WithPassword("xc"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").WithOccurrence(2).WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = container.Terminate(ctx) })

	conn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)
	pool, err := pgxpool.New(ctx, conn)
	require.NoError(t, err)
	t.Cleanup(pool.Close)

	applyMigrations(t, ctx, pool)
	return pool
}

func applyMigrations(t *testing.T, ctx context.Context, pool *pgxpool.Pool) {
	t.Helper()
	files, err := filepath.Glob(filepath.Join("..", "..", "..", "..", "migrations", "*.up.sql"))
	if err != nil || len(files) == 0 {
		// fall back to repo-root migrations relative to the module
		files, _ = filepath.Glob(filepath.Join("..", "..", "..", "migrations", "*.up.sql"))
	}
	require.NotEmpty(t, files, "no migration files found")
	sort.Strings(files)
	for _, f := range files {
		sql, err := os.ReadFile(f)
		require.NoError(t, err)
		_, err = pool.Exec(ctx, string(sql))
		require.NoErrorf(t, err, "migration %s", filepath.Base(f))
	}
}

func TestIntegration_MigrationsAndContentRepo(t *testing.T) {
	pool := startPostgres(t)
	ctx := context.Background()

	// Migrations applied to the latest version.
	var version int
	require.NoError(t, pool.QueryRow(ctx, `SELECT max(version) FROM schema_migrations`).Scan(&version))
	assert.GreaterOrEqual(t, version, 24)

	// Repository queries must be valid against the real schema (regression guard
	// for the NULL-scan / column-mismatch bug class) — empty data, no error.
	repo := db.NewContentRepo(pool)
	_, err := repo.ListServices(ctx)
	assert.NoError(t, err, "ListServices")
	_, err = repo.ListCaseDossiers(ctx, map[string]string{})
	assert.NoError(t, err, "ListCaseDossiers")
	_, err = repo.ListInsights(ctx, "", "en")
	assert.NoError(t, err, "ListInsights")
	_, err = repo.ListReadingListItems(ctx, "")
	assert.NoError(t, err, "ListReadingListItems")
	_, err = repo.ListSubsidiaries(ctx)
	assert.NoError(t, err, "ListSubsidiaries")

	// Round-trip: insert a service and read it back.
	_, err = pool.Exec(ctx, `
		INSERT INTO content.services (slug, service_line, title, summary, status)
		VALUES ('itest', 'ai_automation', 'Integration Test Service', 'summary', 'published')`)
	require.NoError(t, err)
	services, err := repo.ListServices(ctx)
	require.NoError(t, err)
	assert.NotEmpty(t, services)
}
