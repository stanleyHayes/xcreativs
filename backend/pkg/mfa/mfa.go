package mfa

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"strings"
	"time"

	"github.com/pquerna/otp/totp"
)

// GenerateSecret creates a new TOTP secret.
func GenerateSecret() (string, error) {
	secret := make([]byte, 20)
	if _, err := rand.Read(secret); err != nil {
		return "", fmt.Errorf("generate secret: %w", err)
	}
	return base32.StdEncoding.EncodeToString(secret), nil
}

// GenerateQRCodeURL generates a QR code (otpauth) URL for TOTP enrollment.
//
// `secret` is the base32-encoded string from GenerateSecret. totp.Generate
// base32-encodes whatever raw bytes it is given, so the secret must be decoded
// back to raw bytes first — passing the base32 string directly double-encodes
// it, producing a QR secret that never matches ValidateCode (which checks the
// single-encoded secret). That mismatch is what made every code fail with 400.
func GenerateQRCodeURL(issuer, accountName, secret string) string {
	raw, err := base32.StdEncoding.DecodeString(strings.ToUpper(strings.ReplaceAll(secret, " ", "")))
	if err != nil {
		return ""
	}
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: accountName,
		Secret:      raw,
	})
	if err != nil {
		return ""
	}
	return key.URL()
}

// ValidateCode validates a TOTP code against a secret.
func ValidateCode(secret, code string) bool {
	secret = strings.ToUpper(strings.ReplaceAll(secret, " ", ""))
	return totp.Validate(code, secret)
}

// GenerateCode generates a TOTP code (mainly for testing).
func GenerateCode(secret string) (string, error) {
	secret = strings.ToUpper(strings.ReplaceAll(secret, " ", ""))
	return totp.GenerateCode(secret, time.Now())
}
