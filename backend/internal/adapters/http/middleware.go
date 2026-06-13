package http

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LoggerMiddleware logs incoming requests.
func LoggerMiddleware(log Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Extract or generate request ID for tracing
			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = generateRequestID()
			}
			w.Header().Set("X-Request-ID", requestID)

			next.ServeHTTP(ww, r)

			duration := time.Since(start).Milliseconds()
			if ww.statusCode >= 500 {
				log.Error("http request error",
					"request_id", requestID,
					"method", r.Method,
					"path", r.URL.Path,
					"status", ww.statusCode,
					"duration_ms", duration,
					"remote_addr", r.RemoteAddr,
				)
			} else {
				log.Info("http request",
					"request_id", requestID,
					"method", r.Method,
					"path", r.URL.Path,
					"status", ww.statusCode,
					"duration_ms", duration,
					"remote_addr", r.RemoteAddr,
				)
			}
		})
	}
}

// CORSMiddleware handles CORS headers.
func CORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	wildcard := false
	allowed := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		o = strings.TrimSpace(o)
		if o == "*" {
			wildcard = true
		} else if o != "" {
			allowed[o] = true
		}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			w.Header().Add("Vary", "Origin")
			switch {
			case origin != "" && allowed[origin]:
				w.Header().Set("Access-Control-Allow-Origin", origin)
				// Credentials may only be combined with an explicit origin.
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			case wildcard:
				// Per the CORS spec a wildcard origin cannot carry credentials.
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireMFAMiddleware enforces that authenticated users have MFA enabled
// (agent_plan.md §4.6) when MFA_REQUIRED is set. The MFA-setup, identity, and
// logout endpoints are exempt so a user can still enroll.
func RequireMFAMiddleware(pool *pgxpool.Pool, required bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		if !required {
			return next
		}
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p := r.URL.Path
			if strings.Contains(p, "/auth/mfa/") || strings.HasSuffix(p, "/auth/me") ||
				strings.HasSuffix(p, "/auth/logout") || strings.HasSuffix(p, "/auth/profile") {
				next.ServeHTTP(w, r)
				return
			}
			uid, _ := r.Context().Value(userIDKey).(string)
			if uid == "" {
				next.ServeHTTP(w, r)
				return
			}
			var enabled bool
			if err := pool.QueryRow(r.Context(), `SELECT mfa_enabled FROM identity.users WHERE id = $1`, uid).Scan(&enabled); err == nil && !enabled {
				respondError(w, http.StatusForbidden, "mfa_required")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequestSizeLimitMiddleware limits request body sizes to prevent DoS.
func RequestSizeLimitMiddleware(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

// SecurityHeadersMiddleware adds security-related HTTP headers. HSTS is only
// emitted in production (over HTTP it is ignored, but it is reserved for TLS).
func SecurityHeadersMiddleware(production bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			if production {
				w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			}
			// CSP - strict default for API, relaxed for document intelligence file uploads
			csp := "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
			w.Header().Set("Content-Security-Policy", csp)
			next.ServeHTTP(w, r)
		})
	}
}

// rateLimitEntry tracks request counts per IP.
type rateLimitEntry struct {
	count  int
	window time.Time
}

// RateLimitMiddleware is a simple per-IP rate limiter using an in-memory map.
// Allows 100 requests per minute per IP for public routes, 1000 for authenticated.
func RateLimitMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	clients := make(map[string]*rateLimitEntry)
	var mu sync.Mutex

	// Background cleanup of stale entries every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			now := time.Now()
			for ip, entry := range clients {
				if now.Sub(entry.window) > 5*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.Header.Get("X-Forwarded-For")
			if ip == "" {
				ip = r.Header.Get("X-Real-Ip")
			}
			if ip == "" {
				if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
					ip = host
				} else {
					ip = r.RemoteAddr
				}
			}

			// Higher limit for authenticated users
			limit := 100
			if r.Header.Get("Authorization") != "" {
				limit = 1000
			}

			mu.Lock()
			now := time.Now()
			entry, exists := clients[ip]
			if !exists || now.Sub(entry.window) > time.Minute {
				clients[ip] = &rateLimitEntry{count: 1, window: now}
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}

			if entry.count >= limit {
				mu.Unlock()
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{"error": "rate limit exceeded"})
				return
			}

			entry.count++
			mu.Unlock()
			next.ServeHTTP(w, r)
		})
	}
}

// AuditLogMiddleware records authenticated requests to the audit log asynchronously.
func AuditLogMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only log state-changing operations
			if r.Method == http.MethodGet || r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}

			ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			var userID string

			// Wrap next handler to capture userID from the authenticated context
			next.ServeHTTP(ww, r)
			userID, _ = r.Context().Value(userIDKey).(string)

			if userID == "" {
				return
			}

			ip := r.Header.Get("X-Forwarded-For")
			if ip == "" {
				ip = r.Header.Get("X-Real-Ip")
			}
			if ip == "" {
				if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
					ip = host
				} else {
					ip = r.RemoteAddr
				}
			}

			// Fire-and-forget audit log insert
			go func() {
				ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				_, _ = pool.Exec(ctx, `
					INSERT INTO identity.audit_log (user_id, action, resource, resource_id, ip_address, user_agent, metadata)
					VALUES ($1, $2, $3, $4, $5, $6, $7)
				`, userID, r.Method, r.URL.Path, "", ip, r.UserAgent(), map[string]any{
					"status_code": ww.statusCode,
				})
			}()
		})
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Flush and Unwrap let the wrapper stay transparent to streaming (SSE) handlers.
func (rw *responseWriter) Flush() {
	if f, ok := rw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (rw *responseWriter) Unwrap() http.ResponseWriter {
	return rw.ResponseWriter
}

func generateRequestID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
