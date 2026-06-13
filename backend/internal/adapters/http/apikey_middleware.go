package http

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/adapters/db"
)

// APIKeyMiddleware validates API key authentication for scoped access.
func APIKeyMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	identity := db.NewIdentityRepo(pool)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "ApiKey ") {
				next.ServeHTTP(w, r)
				return
			}

			key := strings.TrimPrefix(authHeader, "ApiKey ")
			hash := sha256.Sum256([]byte(key))
			hashStr := hex.EncodeToString(hash[:])

			k, err := identity.GetAPIKeyByHash(r.Context(), hashStr)
			if err != nil || k == nil || !k.IsActive {
				respondError(w, http.StatusUnauthorized, "invalid api key")
				return
			}

			if k.ExpiresAt != nil && k.ExpiresAt.Before(time.Now()) {
				respondError(w, http.StatusUnauthorized, "api key expired")
				return
			}

			// Update last used
			_ = identity.UpdateAPIKeyLastUsed(r.Context(), k.ID.String())

			// Fetch user role for context
			user, err := identity.GetUserByID(r.Context(), k.UserID.String())
			role := ""
			if err == nil && user != nil {
				role = user.Role
			}

			// Attach user ID and scopes to context
			ctx := r.Context()
			ctx = context.WithValue(ctx, userIDKey, k.UserID.String())
			ctx = context.WithValue(ctx, userRoleKey, role)
			ctx = context.WithValue(ctx, userEmailKey, "")
			ctx = context.WithValue(ctx, apiKeyScopesKey, k.Scopes)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

var apiKeyScopesKey contextKey = "api_key_scopes"

func hasScope(ctx context.Context, required string) bool {
	scopes, ok := ctx.Value(apiKeyScopesKey).([]string)
	if !ok {
		return false
	}
	for _, s := range scopes {
		if s == required || s == "admin" {
			return true
		}
	}
	return false
}

// isAPIKeyAuth returns true if the request was authenticated via API key.
func isAPIKeyAuth(ctx context.Context) bool {
	_, ok := ctx.Value(apiKeyScopesKey).([]string)
	return ok
}

// RequireScope middleware ensures API key requests have the required scope.
// JWT-authenticated requests bypass scope checks.
func RequireScope(required string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if isAPIKeyAuth(r.Context()) && !hasScope(r.Context(), required) {
				respondError(w, http.StatusForbidden, "insufficient scope")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
