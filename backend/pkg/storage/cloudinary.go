// Package storage provides media/file uploads via Cloudinary.
package storage

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

// Cloudinary uploads files to a Cloudinary account using signed uploads.
type Cloudinary struct {
	cloudName string
	apiKey    string
	apiSecret string
	client    *http.Client
}

// NewCloudinaryFromEnv builds a Cloudinary client from CLOUDINARY_* env vars.
// Call Configured() before use — it is a no-op until credentials are set.
func NewCloudinaryFromEnv() *Cloudinary {
	return &Cloudinary{
		cloudName: os.Getenv("CLOUDINARY_CLOUD_NAME"),
		apiKey:    os.Getenv("CLOUDINARY_API_KEY"),
		apiSecret: os.Getenv("CLOUDINARY_API_SECRET"),
		client:    &http.Client{Timeout: 60 * time.Second},
	}
}

// Configured reports whether all credentials are present.
func (c *Cloudinary) Configured() bool {
	return c.cloudName != "" && c.apiKey != "" && c.apiSecret != ""
}

// endpoint is a package var so tests can point it at a stub server.
var endpoint = "https://api.cloudinary.com/v1_1"

// UploadResult is the subset of the Cloudinary response we surface.
type UploadResult struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Bytes     int    `json:"bytes"`
	Format    string `json:"format"`
}

// UploadBytes performs a signed upload of raw bytes.
// resourceType is one of "image", "video" (audio uses video), "raw", or "auto".
func (c *Cloudinary) UploadBytes(ctx context.Context, folder, publicID string, data []byte, resourceType string) (*UploadResult, error) {
	if !c.Configured() {
		return nil, fmt.Errorf("cloudinary not configured")
	}
	if resourceType == "" {
		resourceType = "auto"
	}
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// Parameters included in the signature (everything except file, api_key,
	// resource_type and cloud_name), sorted alphabetically.
	toSign := map[string]string{"timestamp": timestamp}
	if folder != "" {
		toSign["folder"] = folder
	}
	if publicID != "" {
		toSign["public_id"] = publicID
	}
	signature := c.sign(toSign)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("file", "upload")
	if err != nil {
		return nil, err
	}
	if _, err := fw.Write(data); err != nil {
		return nil, err
	}
	_ = mw.WriteField("api_key", c.apiKey)
	_ = mw.WriteField("timestamp", timestamp)
	_ = mw.WriteField("signature", signature)
	for k, v := range toSign {
		if k == "timestamp" {
			continue
		}
		_ = mw.WriteField(k, v)
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/%s/%s/upload", endpoint, c.cloudName, resourceType)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode >= 400 {
		var e struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		_ = json.Unmarshal(body, &e)
		if e.Error.Message != "" {
			return nil, fmt.Errorf("cloudinary: %s", e.Error.Message)
		}
		return nil, fmt.Errorf("cloudinary upload failed: status %d", resp.StatusCode)
	}
	var out UploadResult
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Cloudinary) sign(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, k+"="+params[k])
	}
	h := sha1.New()
	h.Write([]byte(strings.Join(parts, "&") + c.apiSecret))
	return hex.EncodeToString(h.Sum(nil))
}
