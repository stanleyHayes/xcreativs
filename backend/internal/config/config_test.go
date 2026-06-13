package config

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidate_DevAlwaysPasses(t *testing.T) {
	c := &Config{Env: "development", JWTSecret: "dev", JWTRefreshSecret: "dev2"}
	assert.NoError(t, c.validate())
}

func TestValidate_RequiresJWTSecrets(t *testing.T) {
	c := &Config{Env: "development"}
	assert.Error(t, c.validate())
}

func TestValidate_ProductionRejectsWeakConfig(t *testing.T) {
	c := &Config{
		Env:              "production",
		JWTSecret:        "your-jwt-secret",
		JWTRefreshSecret: "your-jwt-secret",
		DBURL:            "postgres://xcreatives:xcreatives_dev@localhost:5432/xcreatives?sslmode=disable",
		BaseURL:          "http://localhost:3000",
		AllowedOrigins:   []string{"http://localhost:3000"},
	}
	err := c.validate()
	assert.Error(t, err)
	msg := err.Error()
	assert.Contains(t, msg, "JWT_SECRET")
	assert.Contains(t, msg, "sslmode=disable")
	assert.Contains(t, msg, "ALLOWED_ORIGINS")
	assert.Contains(t, msg, "BASE_URL")
}

func TestValidate_ProductionAcceptsStrongConfig(t *testing.T) {
	dbURL := "postgres://u:p@db:5432/x?sslmode=require"
	t.Setenv("DB_URL", dbURL)
	c := &Config{
		Env:              "production",
		JWTSecret:        strings.Repeat("a", 40),
		JWTRefreshSecret: strings.Repeat("b", 40),
		DBURL:            dbURL,
		BaseURL:          "https://xcreativs.com",
		AllowedOrigins:   []string{"https://xcreativs.com"},
	}
	assert.NoError(t, c.validate())
}
