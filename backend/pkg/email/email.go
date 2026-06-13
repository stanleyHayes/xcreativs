// Package email provides transactional email sending.
package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Sender defines the contract for sending transactional emails.
type Sender interface {
	Send(ctx context.Context, to, subject, htmlBody, textBody string) error
}

// Config holds email service configuration.
type Config struct {
	FromAddress string
	FromName    string
	BaseURL     string
}

// NewSender creates an email sender based on configuration.
// If resendAPIKey is provided, it uses Resend. Otherwise, it logs to stdout.
func NewSender(resendAPIKey string, cfg Config) Sender {
	if resendAPIKey != "" {
		return &ResendSender{apiKey: resendAPIKey, cfg: cfg}
	}
	return &ConsoleSender{cfg: cfg}
}

// resendEndpoint is a package var so tests can point it at a stub server.
var resendEndpoint = "https://api.resend.com/emails"

// ResendSender sends emails via the Resend API.
type ResendSender struct {
	apiKey string
	cfg    Config
}

func (s *ResendSender) Send(ctx context.Context, to, subject, htmlBody, textBody string) error {
	// Marshal with encoding/json so subjects/names/bodies containing quotes,
	// backslashes or newlines are escaped correctly.
	payload, err := json.Marshal(map[string]any{
		"from":    s.from(),
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
		"text":    textBody,
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resendEndpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("resend API error: status %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

func (s *ResendSender) from() string {
	if s.cfg.FromName != "" {
		return fmt.Sprintf("%s <%s>", s.cfg.FromName, s.cfg.FromAddress)
	}
	return s.cfg.FromAddress
}

// ConsoleSender logs emails to stdout for development.
type ConsoleSender struct {
	cfg Config
}

func (s *ConsoleSender) Send(ctx context.Context, to, subject, htmlBody, textBody string) error {
	fmt.Println("========== EMAIL ==========")
	fmt.Printf("To: %s\n", to)
	fmt.Printf("From: %s\n", s.from())
	fmt.Printf("Subject: %s\n", subject)
	fmt.Println("---------- TEXT ----------")
	fmt.Println(textBody)
	fmt.Println("==========================")
	return nil
}

func (s *ConsoleSender) from() string {
	if s.cfg.FromName != "" {
		return fmt.Sprintf("%s <%s>", s.cfg.FromName, s.cfg.FromAddress)
	}
	return s.cfg.FromAddress
}
