package http

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// OAuth2 SSO (agent_plan.md §4.1): Google + Microsoft sign-in. Isolated from the
// rest of the auth code; provider credentials are read from the environment:
//   GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET
//   MICROSOFT_OAUTH_CLIENT_ID / MICROSOFT_OAUTH_CLIENT_SECRET
// When a provider's client id is unset, its endpoints return 501.

type oauthProvider struct {
	authURL     string
	tokenURL    string
	userinfoURL string
	scope       string
	clientID    string
	secret      string
}

func oauthConfig(provider string) (oauthProvider, bool) {
	switch provider {
	case "google":
		return oauthProvider{
			authURL:     "https://accounts.google.com/o/oauth2/v2/auth",
			tokenURL:    "https://oauth2.googleapis.com/token",
			userinfoURL: "https://www.googleapis.com/oauth2/v2/userinfo",
			scope:       "openid email profile",
			clientID:    os.Getenv("GOOGLE_OAUTH_CLIENT_ID"),
			secret:      os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
		}, true
	case "microsoft":
		return oauthProvider{
			authURL:     "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
			tokenURL:    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
			userinfoURL: "https://graph.microsoft.com/oidc/userinfo",
			scope:       "openid email profile",
			clientID:    os.Getenv("MICROSOFT_OAUTH_CLIENT_ID"),
			secret:      os.Getenv("MICROSOFT_OAUTH_CLIENT_SECRET"),
		}, true
	case "oidc":
		// Generic enterprise OIDC connector (Okta, Azure AD, Auth0, Keycloak…).
		// Endpoints are configured directly to avoid a startup discovery call.
		scope := os.Getenv("OIDC_SCOPE")
		if scope == "" {
			scope = "openid email profile"
		}
		return oauthProvider{
			authURL:     os.Getenv("OIDC_AUTH_URL"),
			tokenURL:    os.Getenv("OIDC_TOKEN_URL"),
			userinfoURL: os.Getenv("OIDC_USERINFO_URL"),
			scope:       scope,
			clientID:    os.Getenv("OIDC_CLIENT_ID"),
			secret:      os.Getenv("OIDC_CLIENT_SECRET"),
		}, true
	default:
		return oauthProvider{}, false
	}
}

func randomToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func requestScheme(r *http.Request) string {
	if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		return "https"
	}
	return "http"
}

func oauthRedirectURI(r *http.Request, provider string) string {
	return requestScheme(r) + "://" + r.Host + "/api/v1/auth/oauth/" + provider + "/callback"
}

func frontendBaseURL(deps *AuthHandlerDependencies) string {
	if deps != nil && deps.BaseURL != "" {
		return strings.TrimRight(deps.BaseURL, "/")
	}
	if b := strings.TrimRight(os.Getenv("BASE_URL"), "/"); b != "" {
		return b
	}
	return "http://localhost:3001"
}

func handleOAuthLogin(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		provider := chi.URLParam(r, "provider")
		cfg, ok := oauthConfig(provider)
		if !ok {
			respondError(w, http.StatusNotFound, "unknown provider")
			return
		}
		if cfg.clientID == "" || cfg.authURL == "" {
			respondError(w, http.StatusNotImplemented, provider+" SSO is not configured")
			return
		}
		state := randomToken()
		http.SetCookie(w, &http.Cookie{
			Name: "oauth_state", Value: state, Path: "/", HttpOnly: true,
			SameSite: http.SameSiteLaxMode, MaxAge: 600, Secure: requestScheme(r) == "https",
		})
		q := url.Values{}
		q.Set("client_id", cfg.clientID)
		q.Set("redirect_uri", oauthRedirectURI(r, provider))
		q.Set("response_type", "code")
		q.Set("scope", cfg.scope)
		q.Set("state", state)
		q.Set("access_type", "offline")
		q.Set("prompt", "select_account")
		http.Redirect(w, r, cfg.authURL+"?"+q.Encode(), http.StatusFound)
	}
}

func handleOAuthCallback(pool *pgxpool.Pool, deps *AuthHandlerDependencies) http.HandlerFunc {
	fail := func(w http.ResponseWriter, r *http.Request, reason string) {
		http.Redirect(w, r, frontendBaseURL(deps)+"/login?sso_error="+url.QueryEscape(reason), http.StatusFound)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		provider := chi.URLParam(r, "provider")
		cfg, ok := oauthConfig(provider)
		if !ok || cfg.clientID == "" {
			fail(w, r, "provider unavailable")
			return
		}
		// CSRF: state must match the cookie.
		state := r.URL.Query().Get("state")
		cookie, err := r.Cookie("oauth_state")
		if err != nil || state == "" || cookie.Value != state {
			fail(w, r, "invalid state")
			return
		}
		code := r.URL.Query().Get("code")
		if code == "" {
			fail(w, r, "missing code")
			return
		}

		// Exchange the authorization code for an access token.
		form := url.Values{}
		form.Set("client_id", cfg.clientID)
		form.Set("client_secret", cfg.secret)
		form.Set("code", code)
		form.Set("grant_type", "authorization_code")
		form.Set("redirect_uri", oauthRedirectURI(r, provider))
		client := &http.Client{Timeout: 12 * time.Second}
		tokResp, err := client.PostForm(cfg.tokenURL, form)
		if err != nil {
			fail(w, r, "token exchange failed")
			return
		}
		defer tokResp.Body.Close()
		var tok struct {
			AccessToken string `json:"access_token"`
		}
		if err := json.NewDecoder(tokResp.Body).Decode(&tok); err != nil || tok.AccessToken == "" {
			fail(w, r, "token exchange failed")
			return
		}

		// Fetch the user profile.
		uiReq, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, cfg.userinfoURL, nil)
		uiReq.Header.Set("Authorization", "Bearer "+tok.AccessToken)
		uiResp, err := client.Do(uiReq)
		if err != nil {
			fail(w, r, "profile fetch failed")
			return
		}
		defer uiResp.Body.Close()
		var profile struct {
			Email      string `json:"email"`
			GivenName  string `json:"given_name"`
			FamilyName string `json:"family_name"`
			Name       string `json:"name"`
			Picture    string `json:"picture"`
		}
		_ = json.NewDecoder(uiResp.Body).Decode(&profile)
		email := strings.ToLower(strings.TrimSpace(profile.Email))
		if email == "" {
			fail(w, r, "no email from provider")
			return
		}
		first, last := splitName(profile)

		// Upsert the user (no password — OAuth identity). Email is provider-verified.
		var userID, role string
		err = pool.QueryRow(r.Context(), `
			INSERT INTO identity.users (email, first_name, last_name, avatar_url, role, is_active, email_verified_at, last_login_at)
			VALUES ($1, $2, $3, $4, 'viewer', TRUE, NOW(), NOW())
			ON CONFLICT (email) DO UPDATE
			  SET last_login_at = NOW(),
			      avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), identity.users.avatar_url),
			      updated_at = NOW()
			RETURNING id, role::text
		`, email, first, last, profile.Picture).Scan(&userID, &role)
		if err != nil {
			fail(w, r, "account provisioning failed")
			return
		}

		// Issue our own tokens + session (matches the password login flow).
		access, err := deps.JWT.GenerateAccessToken(userID, email, role, nil)
		if err != nil {
			fail(w, r, "token issue failed")
			return
		}
		refresh, err := deps.JWT.GenerateRefreshToken(userID)
		if err != nil {
			fail(w, r, "token issue failed")
			return
		}
		uid, _ := uuid.Parse(userID)
		hash := sha256.Sum256([]byte(refresh))
		_ = deps.Identity.CreateSession(r.Context(), &domain.Session{
			ID:               uuid.New(),
			UserID:           uid,
			RefreshTokenHash: hex.EncodeToString(hash[:]),
			IPAddress:        clientIP(r),
			UserAgent:        r.UserAgent(),
			ExpiresAt:        time.Now().Add(30 * 24 * time.Hour),
		})

		// Hand the tokens to the frontend SSO landing page.
		q := url.Values{}
		q.Set("access_token", access)
		q.Set("refresh_token", refresh)
		http.Redirect(w, r, frontendBaseURL(deps)+"/auth/sso?"+q.Encode(), http.StatusFound)
	}
}

func splitName(p struct {
	Email      string `json:"email"`
	GivenName  string `json:"given_name"`
	FamilyName string `json:"family_name"`
	Name       string `json:"name"`
	Picture    string `json:"picture"`
}) (first, last string) {
	first, last = p.GivenName, p.FamilyName
	if first == "" && p.Name != "" {
		parts := strings.Fields(p.Name)
		first = parts[0]
		if len(parts) > 1 {
			last = strings.Join(parts[1:], " ")
		}
	}
	if first == "" {
		first = strings.SplitN(p.Email, "@", 2)[0]
	}
	if last == "" {
		last = "—"
	}
	return first, last
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.SplitN(xff, ",", 2)[0])
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i > 0 {
		host = host[:i]
	}
	return host
}
