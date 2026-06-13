package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents JWT claims for XCreativs.
type Claims struct {
	UserID string   `json:"user_id"`
	Email  string   `json:"email"`
	Role   string   `json:"role"`
	Scopes []string `json:"scopes,omitempty"`
	jwt.RegisteredClaims
}

// Generator creates and validates JWTs.
type Generator struct {
	secret        []byte
	refreshSecret []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

// NewGenerator creates a new JWT generator.
func NewGenerator(secret, refreshSecret string, accessExpiry, refreshExpiry time.Duration) *Generator {
	return &Generator{
		secret:        []byte(secret),
		refreshSecret: []byte(refreshSecret),
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// GenerateAccessToken creates a new access token.
func (g *Generator) GenerateAccessToken(userID, email, role string, scopes []string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Scopes: scopes,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(g.accessExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.NewString(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(g.secret)
}

// GenerateRefreshToken creates a new refresh token.
func (g *Generator) GenerateRefreshToken(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(g.refreshExpiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        uuid.NewString(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(g.refreshSecret)
}

// ValidateAccessToken validates an access token and returns claims.
func (g *Generator) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return g.secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token claims")
}

// ValidateRefreshToken validates a refresh token and returns the subject.
func (g *Generator) ValidateRefreshToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return g.refreshSecret, nil
	})
	if err != nil {
		return "", err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		sub, _ := claims["sub"].(string)
		return sub, nil
	}
	return "", fmt.Errorf("invalid refresh token")
}
