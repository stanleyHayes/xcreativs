package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration.
type Config struct {
	Env              string
	Port             string
	DBURL            string
	RedisURL         string
	JWTSecret        string
	JWTRefreshSecret string
	ResendAPIKey     string
	EmailFromAddress string
	EmailFromName    string
	BaseURL          string
	AllowedOrigins   []string
	MFARequired      bool
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		Env:              getEnv("ENV", "development"),
		Port:             getEnv("PORT", "8080"),
		DBURL:            getEnv("DB_URL", "postgres://xcreatives:xcreatives_dev@localhost:5432/xcreatives?sslmode=disable"),
		RedisURL:         getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:        requireEnv("JWT_SECRET"),
		JWTRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
		ResendAPIKey:     getEnv("RESEND_API_KEY", ""),
		EmailFromAddress: getEnv("EMAIL_FROM_ADDRESS", "noreply@xcreativs.com"),
		EmailFromName:    getEnv("EMAIL_FROM_NAME", "XCreativs"),
		BaseURL:          getEnv("BASE_URL", "http://localhost:3000"),
		AllowedOrigins:   strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		MFARequired:      getEnvBool("MFA_REQUIRED", false),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// validate enforces baseline requirements always, and stricter checks when
// ENV=production so an unsafe deployment fails fast at startup instead of
// silently running with development defaults.
func (c *Config) validate() error {
	if c.JWTSecret == "" || c.JWTRefreshSecret == "" {
		return fmt.Errorf("JWT_SECRET and JWT_REFRESH_SECRET are required")
	}
	if c.Env != "production" {
		return nil
	}

	var problems []string
	weak := func(s string) bool { return len(s) < 32 || strings.Contains(s, "your-jwt") }
	if weak(c.JWTSecret) {
		problems = append(problems, "JWT_SECRET must be a strong random value of at least 32 characters")
	}
	if weak(c.JWTRefreshSecret) {
		problems = append(problems, "JWT_REFRESH_SECRET must be a strong random value of at least 32 characters")
	}
	if c.JWTSecret == c.JWTRefreshSecret {
		problems = append(problems, "JWT_SECRET and JWT_REFRESH_SECRET must be different")
	}
	if os.Getenv("DB_URL") == "" || strings.Contains(c.DBURL, "xcreatives_dev") {
		problems = append(problems, "DB_URL must be set explicitly (not the development default)")
	}
	if strings.Contains(c.DBURL, "sslmode=disable") {
		problems = append(problems, "DB_URL must not use sslmode=disable in production")
	}
	for _, o := range c.AllowedOrigins {
		o = strings.TrimSpace(o)
		if o == "*" || strings.Contains(o, "localhost") {
			problems = append(problems, "ALLOWED_ORIGINS must list explicit production origins (no '*' or localhost)")
			break
		}
	}
	if c.BaseURL == "" || strings.Contains(c.BaseURL, "localhost") {
		problems = append(problems, "BASE_URL must be set to the production URL")
	}
	if len(problems) > 0 {
		return fmt.Errorf("invalid production configuration:\n  - %s", strings.Join(problems, "\n  - "))
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	return os.Getenv(key)
}

func getEnvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return i
}
