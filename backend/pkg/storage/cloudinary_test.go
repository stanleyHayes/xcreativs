package storage

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCloudinary_Configured(t *testing.T) {
	assert.False(t, (&Cloudinary{}).Configured())
	assert.True(t, (&Cloudinary{cloudName: "c", apiKey: "k", apiSecret: "s"}).Configured())
}

func TestCloudinary_Sign(t *testing.T) {
	c := &Cloudinary{apiSecret: "secret"}
	got := c.sign(map[string]string{"timestamp": "123", "folder": "uploads"})
	// expected = sha1("folder=uploads&timestamp=123" + "secret")
	h := sha1.New()
	h.Write([]byte("folder=uploads&timestamp=123secret"))
	assert.Equal(t, hex.EncodeToString(h.Sum(nil)), got)
}

func TestCloudinary_UploadBytes(t *testing.T) {
	var gotPath, gotContentType string
	var hadFile, hadSig bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotContentType = r.Header.Get("Content-Type")
		_ = r.ParseMultipartForm(1 << 20)
		if r.MultipartForm != nil {
			_, hadFile = r.MultipartForm.File["file"]
			hadSig = r.FormValue("signature") != "" && r.FormValue("api_key") == "key"
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"secure_url":"https://res.cloudinary.com/x/upload/v1/uploads/abc.png","public_id":"uploads/abc","bytes":123,"format":"png"}`))
	}))
	defer srv.Close()

	orig := endpoint
	endpoint = srv.URL
	defer func() { endpoint = orig }()

	c := &Cloudinary{cloudName: "demo", apiKey: "key", apiSecret: "secret", client: srv.Client()}
	res, err := c.UploadBytes(context.Background(), "uploads", "", []byte("PNGDATA"), "image")
	require.NoError(t, err)
	assert.Equal(t, "https://res.cloudinary.com/x/upload/v1/uploads/abc.png", res.SecureURL)
	assert.Equal(t, "/demo/image/upload", gotPath)
	assert.True(t, strings.HasPrefix(gotContentType, "multipart/form-data"))
	assert.True(t, hadFile, "file part present")
	assert.True(t, hadSig, "signature + api_key present")
}

func TestCloudinary_UploadNotConfigured(t *testing.T) {
	_, err := (&Cloudinary{}).UploadBytes(context.Background(), "f", "", []byte("x"), "auto")
	require.Error(t, err)
}
