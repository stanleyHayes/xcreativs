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

// GenerateQRCodeURL generates a QR code URL for TOTP enrollment.
func GenerateQRCodeURL(issuer, accountName, secret string) string {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: accountName,
		Secret:      []byte(secret),
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
