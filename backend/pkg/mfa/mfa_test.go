package mfa

import (
	"net/url"
	"testing"
	"time"

	"github.com/pquerna/otp/totp"
)

// TestQRSecretMatchesValidation guards against the double-base32-encoding
// regression: the secret embedded in the otpauth QR URL (what the authenticator
// app reads) must be the same secret ValidateCode checks. Otherwise every code
// fails with "invalid code" (HTTP 400).
func TestQRSecretMatchesValidation(t *testing.T) {
	secret, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret: %v", err)
	}

	qr := GenerateQRCodeURL("XCreativs", "user@example.com", secret)
	if qr == "" {
		t.Fatal("GenerateQRCodeURL returned empty")
	}

	u, err := url.Parse(qr)
	if err != nil {
		t.Fatalf("parse qr url: %v", err)
	}
	if got := u.Query().Get("issuer"); got != "XCreativs" {
		t.Errorf("issuer = %q, want XCreativs", got)
	}
	qrSecret := u.Query().Get("secret")
	if qrSecret == "" {
		t.Fatal("qr url has no secret param")
	}

	// Generate a code from the QR's secret (exactly what the authenticator does)
	// and confirm it validates against our stored secret.
	code, err := totp.GenerateCode(qrSecret, time.Now())
	if err != nil {
		t.Fatalf("generate code from qr secret: %v", err)
	}
	if !ValidateCode(secret, code) {
		t.Fatalf("code generated from QR secret did not validate against stored secret")
	}
}

// TestValidateCodeRoundTrip is a basic sanity check for the validator.
func TestValidateCodeRoundTrip(t *testing.T) {
	secret, err := GenerateSecret()
	if err != nil {
		t.Fatalf("GenerateSecret: %v", err)
	}
	code, err := GenerateCode(secret)
	if err != nil {
		t.Fatalf("GenerateCode: %v", err)
	}
	if !ValidateCode(secret, code) {
		t.Fatal("freshly generated code failed validation")
	}
	if ValidateCode(secret, "000000") && code != "000000" {
		t.Skip("unlikely collision; ignore")
	}
}
