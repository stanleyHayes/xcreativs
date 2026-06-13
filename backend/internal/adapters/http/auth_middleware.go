package http

import (
	"context"
	"net/http"
	"strings"

	"xcreatives.com/backend/pkg/jwt"
)

type contextKey string

const (
	userIDKey  contextKey = "user_id"
	userRoleKey contextKey = "user_role"
	userEmailKey contextKey = "user_email"
)

// AuthMiddleware validates JWT access tokens.
func AuthMiddleware(jwtGen *jwt.Generator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip if already authenticated (e.g., by API key middleware)
			if _, ok := r.Context().Value(userIDKey).(string); ok {
				next.ServeHTTP(w, r)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondError(w, http.StatusUnauthorized, "missing authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				respondError(w, http.StatusUnauthorized, "invalid authorization header format")
				return
			}

			claims, err := jwtGen.ValidateAccessToken(parts[1])
			if err != nil {
				respondError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, userRoleKey, claims.Role)
			ctx = context.WithValue(ctx, userEmailKey, claims.Email)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole middleware ensures the user has one of the allowed roles.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(userRoleKey).(string)
			if !ok {
				respondError(w, http.StatusForbidden, "role not found in context")
				return
			}

			for _, allowed := range allowedRoles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			respondError(w, http.StatusForbidden, "insufficient permissions")
		})
	}
}

// OptionalAuthMiddleware tries to validate the token but doesn't reject if missing.
func OptionalAuthMiddleware(jwtGen *jwt.Generator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				next.ServeHTTP(w, r)
				return
			}

			claims, err := jwtGen.ValidateAccessToken(parts[1])
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, userRoleKey, claims.Role)
			ctx = context.WithValue(ctx, userEmailKey, claims.Email)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
