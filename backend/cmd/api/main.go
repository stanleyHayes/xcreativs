package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"xcreatives.com/backend/internal/adapters/db"
	httpadapter "xcreatives.com/backend/internal/adapters/http"
	"xcreatives.com/backend/internal/bootstrap"
	"xcreatives.com/backend/internal/config"
	"xcreatives.com/backend/pkg/jwt"
	"xcreatives.com/backend/pkg/logger"
)

func main() {
	// Optionally hydrate the environment from a Render Secret File (/etc/secrets/.env)
	// or a local ./.env. Real environment variables always take precedence, so this
	// only fills variables the platform didn't already provide.
	config.LoadEnvFiles("/etc/secrets/.env", ".env")

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "config load failed: %v\n", err)
		os.Exit(1)
	}

	log := logger.New(cfg.Env)

	// Database
	pool, err := db.NewPool(context.Background(), cfg.DBURL)
	if err != nil {
		log.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Startup tasks (migrations + admin seed), gated by env vars. The production
	// image is distroless — no migrate CLI — so the schema is applied here.
	bootstrap.RunStartup(context.Background(), log, pool, cfg.DBURL)

	// Seed permissions on startup
	identityRepo := db.NewIdentityRepo(pool)
	if err := identityRepo.SeedPermissions(context.Background()); err != nil {
		log.Warn("permission seed failed", "error", err)
	}

	// JWT
	jwtGen := jwt.NewGenerator(cfg.JWTSecret, cfg.JWTRefreshSecret, 15*time.Minute, 30*24*time.Hour)

	// Cache
	if cfg.RedisURL != "" {
		c := db.NewCache(cfg.RedisURL)
		db.SetGlobalCache(c)
		log.Info("redis cache enabled", "url", cfg.RedisURL)
	}

	// Router
	router := httpadapter.NewRouter(cfg, log, pool, identityRepo, jwtGen)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Error("server shutdown error", "error", err)
		}
	}()

	log.Info("server starting", "port", cfg.Port, "env", cfg.Env)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Error("server failed", "error", err)
		os.Exit(1)
	}
	log.Info("server stopped")
}
