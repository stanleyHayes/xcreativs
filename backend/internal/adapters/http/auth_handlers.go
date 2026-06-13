package http

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net"
	"net/http"
	"net/mail"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"xcreatives.com/backend/internal/domain"
	"xcreatives.com/backend/pkg/email"
	"xcreatives.com/backend/pkg/jwt"
	"xcreatives.com/backend/pkg/mfa"
	"xcreatives.com/backend/pkg/password"
)

// AuthHandlerDependencies holds auth-specific dependencies.
type AuthHandlerDependencies struct {
	Identity    domain.IdentityRepository
	JWT         *jwt.Generator
	Email       domain.EmailSender
	BaseURL     string
	AccessExpiry time.Duration
}

// RegisterRequest represents a registration request.
type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

// LoginRequest represents a login request.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
	MFACode  string `json:"mfa_code"`
}

// TokenResponse represents the token pair response.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	User         UserDTO `json:"user"`
}

// UserDTO represents a safe user response.
type UserDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
	MFAEnabled bool  `json:"mfa_enabled"`
}

func toUserDTO(u *domain.User) UserDTO {
	return UserDTO{
		ID:         u.ID.String(),
		Email:      u.Email,
		FirstName:  u.FirstName,
		LastName:   u.LastName,
		Role:       u.Role,
		MFAEnabled: u.MFAEnabled,
	}
}

func handleRegister(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Email == "" || req.Password == "" || req.FirstName == "" {
			respondError(w, http.StatusBadRequest, "email, password, and first_name are required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}
		if len(req.Password) < 8 {
			respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
			return
		}

		hash, err := password.Hash(req.Password)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to hash password")
			return
		}

		u := &domain.User{
			ID:           uuid.New(),
			Email:        req.Email,
			PasswordHash: hash,
			FirstName:    req.FirstName,
			LastName:     req.LastName,
			Role:         "viewer",
			IsActive:     true,
		}

		if err := deps.Identity.CreateUser(r.Context(), u); err != nil {
			respondError(w, http.StatusConflict, "user already exists")
			return
		}

		respondJSON(w, http.StatusCreated, map[string]any{
			"user": toUserDTO(u),
		})
	}
}

func handleLogin(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		u, err := deps.Identity.GetUserByEmail(r.Context(), req.Email)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		if !u.IsActive {
			respondError(w, http.StatusUnauthorized, "account disabled")
			return
		}

		if !password.Verify(req.Password, u.PasswordHash) {
			respondError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		// MFA check
		if u.MFAEnabled {
			if req.MFACode == "" {
				respondError(w, http.StatusForbidden, "mfa_required")
				return
			}
			if !mfa.ValidateCode(u.MFASecret, req.MFACode) {
				respondError(w, http.StatusUnauthorized, "invalid mfa code")
				return
			}
		}

		// Generate tokens
		accessToken, err := deps.JWT.GenerateAccessToken(u.ID.String(), u.Email, u.Role, nil)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to generate access token")
			return
		}

		refreshToken, err := deps.JWT.GenerateRefreshToken(u.ID.String())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to generate refresh token")
			return
		}

		// Store session
		hash := sha256.Sum256([]byte(refreshToken))
		ip, _, _ := net.SplitHostPort(r.RemoteAddr)
		if ip == "" {
			ip = r.RemoteAddr
		}
		session := &domain.Session{
			ID:               uuid.New(),
			UserID:           u.ID,
			RefreshTokenHash: hex.EncodeToString(hash[:]),
			IPAddress:        ip,
			UserAgent:        r.UserAgent(),
			ExpiresAt:        time.Now().Add(30 * 24 * time.Hour),
		}
		if err := deps.Identity.CreateSession(r.Context(), session); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create session")
			return
		}

		// Update last login
		_ = deps.Identity.UpdateLastLogin(r.Context(), u.ID.String())

		respondJSON(w, http.StatusOK, TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(deps.AccessExpiry.Seconds()),
			User:         toUserDTO(u),
		})
	}
}

func handleRefresh(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		userID, err := deps.JWT.ValidateRefreshToken(req.RefreshToken)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}

		hash := sha256.Sum256([]byte(req.RefreshToken))
		_, err = deps.Identity.GetSessionByRefreshToken(r.Context(), hex.EncodeToString(hash[:]))
		if err != nil {
			respondError(w, http.StatusUnauthorized, "session revoked")
			return
		}

		u, err := deps.Identity.GetUserByID(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "user not found")
			return
		}

		accessToken, err := deps.JWT.GenerateAccessToken(u.ID.String(), u.Email, u.Role, nil)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to generate token")
			return
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"access_token": accessToken,
			"expires_in":   int64(deps.AccessExpiry.Seconds()),
		})
	}
}

func handleMFAEnrollment(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(userIDKey).(string)
		if !ok {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		u, err := deps.Identity.GetUserByID(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "user not found")
			return
		}

		if u.MFAEnabled {
			respondError(w, http.StatusBadRequest, "mfa already enabled")
			return
		}

		secret, err := mfa.GenerateSecret()
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to generate secret")
			return
		}

		qrURL := mfa.GenerateQRCodeURL("XCreativs", u.Email, secret)

		respondJSON(w, http.StatusOK, map[string]any{
			"secret": secret,
			"qr_url": qrURL,
		})
	}
}

func handleMFAVerify(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(userIDKey).(string)
		if !ok {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var req struct {
			Secret string `json:"secret"`
			Code   string `json:"code"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if !mfa.ValidateCode(req.Secret, req.Code) {
			respondError(w, http.StatusBadRequest, "invalid code")
			return
		}

		if err := deps.Identity.EnableMFA(r.Context(), userID, req.Secret); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to enable mfa")
			return
		}

		respondJSON(w, http.StatusOK, map[string]string{"status": "mfa_enabled"})
	}
}

func handleMe(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(userIDKey).(string)
		if !ok {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		u, err := deps.Identity.GetUserByID(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "user not found")
			return
		}

		respondJSON(w, http.StatusOK, toUserDTO(u))
	}
}

func handleUpdateProfile(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(userIDKey).(string)
		if !ok {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var req struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if err := deps.Identity.UpdateUser(r.Context(), userID, req.FirstName, req.LastName, req.Email); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update profile")
			return
		}

		u, err := deps.Identity.GetUserByID(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "user not found")
			return
		}

		respondJSON(w, http.StatusOK, toUserDTO(u))
	}
}

func handleLogout(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if req.RefreshToken == "" {
			respondJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
			return
		}

		hash := sha256.Sum256([]byte(req.RefreshToken))
		session, err := deps.Identity.GetSessionByRefreshToken(r.Context(), hex.EncodeToString(hash[:]))
		if err != nil {
			respondJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
			return
		}

		if err := deps.Identity.RevokeSession(r.Context(), session.ID.String()); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to revoke session")
			return
		}

		respondJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
	}
}

func handleForgotPassword(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		v := NewValidator()
		v.Required("email", req.Email, "email is required")
		v.Email("email", req.Email)
		if !v.Valid() {
			respondError(w, http.StatusBadRequest, v.Errors["email"])
			return
		}

		// Always return success to prevent email enumeration
		u, err := deps.Identity.GetUserByEmail(r.Context(), req.Email)
		if err != nil || u == nil {
			respondJSON(w, http.StatusOK, map[string]string{"message": "If an account exists, a reset link has been sent"})
			return
		}

		// Generate reset token and store hash
		token := uuid.New().String()
		tokenHash := sha256.Sum256([]byte(token))
		expiresAt := time.Now().Add(1 * time.Hour)

		_ = deps.Identity.CreatePasswordResetToken(r.Context(), u.ID.String(), hex.EncodeToString(tokenHash[:]), expiresAt)

		// Send password reset email
		if deps.Email != nil {
			resetURL := deps.BaseURL + "/reset-password?token=" + token
			subject, htmlBody, textBody := email.PasswordResetEmail(email.PasswordResetData{
				FirstName:   u.FirstName,
				ResetURL:    resetURL,
				ExpireHours: 1,
			})
			go deps.Email.Send(r.Context(), u.Email, subject, htmlBody, textBody)
		}

		respondJSON(w, http.StatusOK, map[string]string{"message": "If an account exists, a reset link has been sent"})
	}
}

func handleResetPassword(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Token    string `json:"token"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		v := NewValidator()
		v.Required("token", req.Token, "token is required")
		v.Required("password", req.Password, "password is required")
		v.MinLength("password", req.Password, 8)
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		// Verify token
		tokenHash := sha256.Sum256([]byte(req.Token))
		token, err := deps.Identity.GetPasswordResetToken(r.Context(), hex.EncodeToString(tokenHash[:]))
		if err != nil || token == nil || !token.IsValid() {
			respondError(w, http.StatusBadRequest, "invalid or expired token")
			return
		}

		hash, err := password.Hash(req.Password)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to hash password")
			return
		}

		if err := deps.Identity.UpdateUserPassword(r.Context(), token.UserID.String(), hash); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update password")
			return
		}

		_ = deps.Identity.MarkPasswordResetTokenUsed(r.Context(), hex.EncodeToString(tokenHash[:]))

		respondJSON(w, http.StatusOK, map[string]string{"message": "password updated successfully"})
	}
}

func handleResendVerification(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		u, err := deps.Identity.GetUserByID(r.Context(), userID)
		if err != nil || u == nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		if u.EmailVerifiedAt != nil {
			respondError(w, http.StatusBadRequest, "email already verified")
			return
		}

		token := uuid.New().String()
		tokenHash := sha256.Sum256([]byte(token))
		expiresAt := time.Now().Add(24 * time.Hour)

		_ = deps.Identity.CreateEmailVerificationToken(r.Context(), u.ID.String(), hex.EncodeToString(tokenHash[:]), expiresAt)

		// Send verification email
		if deps.Email != nil {
			verifyURL := deps.BaseURL + "/verify-email?token=" + token
			subject, htmlBody, textBody := email.VerificationEmail(email.EmailVerificationData{
				FirstName:       u.FirstName,
				VerificationURL: verifyURL,
				ExpireHours:     24,
			})
			go deps.Email.Send(r.Context(), u.Email, subject, htmlBody, textBody)
		}

		respondJSON(w, http.StatusOK, map[string]string{"message": "verification email sent"})
	}
}

func handleVerifyEmail(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Token string `json:"token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Token == "" {
			respondError(w, http.StatusBadRequest, "token is required")
			return
		}

		tokenHash := sha256.Sum256([]byte(req.Token))
		token, err := deps.Identity.GetEmailVerificationToken(r.Context(), hex.EncodeToString(tokenHash[:]))
		if err != nil || token == nil || !token.IsValid() {
			respondError(w, http.StatusBadRequest, "invalid or expired token")
			return
		}

		if err := deps.Identity.VerifyUserEmail(r.Context(), token.UserID.String()); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to verify email")
			return
		}

		_ = deps.Identity.MarkEmailVerificationTokenUsed(r.Context(), hex.EncodeToString(tokenHash[:]))

		respondJSON(w, http.StatusOK, map[string]string{"message": "email verified successfully"})
	}
}

func handleListSessions(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		sessions, err := deps.Identity.ListUserSessions(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list sessions")
			return
		}
		var result []map[string]any
		for _, s := range sessions {
			result = append(result, map[string]any{
				"id":         s.ID,
				"ip_address": s.IPAddress,
				"user_agent": s.UserAgent,
				"created_at": s.CreatedAt,
				"expires_at": s.ExpiresAt,
			})
		}
		respondJSON(w, http.StatusOK, map[string]any{"sessions": result})
	}
}

func handleRevokeSession(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		sessionID := chi.URLParam(r, "id")
		if sessionID == "" {
			respondError(w, http.StatusBadRequest, "session id required")
			return
		}
		// Verify the session belongs to the current user
		sessions, err := deps.Identity.ListUserSessions(r.Context(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to verify session")
			return
		}
		var owned bool
		for _, s := range sessions {
			if s.ID.String() == sessionID {
				owned = true
				break
			}
		}
		if !owned {
			respondError(w, http.StatusForbidden, "cannot revoke this session")
			return
		}
		if err := deps.Identity.RevokeSession(r.Context(), sessionID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to revoke session")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "revoked"})
	}
}

func handleRevokeAllSessions(deps *AuthHandlerDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(userIDKey).(string)
		if err := deps.Identity.RevokeAllUserSessions(r.Context(), userID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to revoke sessions")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "all_revoked"})
	}
}
