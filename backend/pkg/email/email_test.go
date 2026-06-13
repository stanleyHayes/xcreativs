package email

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewSender_SelectsProvider(t *testing.T) {
	assert.IsType(t, &ResendSender{}, NewSender("re_key", Config{}))
	assert.IsType(t, &ConsoleSender{}, NewSender("", Config{}))
}

// Regression: subjects/bodies with quotes, backslashes and newlines must produce
// valid JSON (the old fmt.Sprintf payload broke on these).
func TestResendSend_EscapesSpecialChars(t *testing.T) {
	var captured map[string]any
	var authHeader string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader = r.Header.Get("Authorization")
		body, _ := io.ReadAll(r.Body)
		// A valid JSON body is the whole point of the fix.
		require.NoError(t, json.Unmarshal(body, &captured), "request body must be valid JSON")
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	orig := resendEndpoint
	resendEndpoint = srv.URL
	defer func() { resendEndpoint = orig }()

	s := &ResendSender{apiKey: "re_test", cfg: Config{FromAddress: "noreply@xcreativs.com", FromName: "XCreativs"}}
	err := s.Send(context.Background(),
		"client@example.com",
		`Re: "Acme Corp" — update \ status`,
		"<p>line one\nline two</p>",
		"plain \"quoted\" text\nwith newline",
	)
	require.NoError(t, err)

	assert.Equal(t, "Bearer re_test", authHeader)
	assert.Equal(t, `Re: "Acme Corp" — update \ status`, captured["subject"])
	assert.Equal(t, "XCreativs <noreply@xcreativs.com>", captured["from"])
	assert.Equal(t, []any{"client@example.com"}, captured["to"])
}

func TestResendSend_ReturnsErrorOnAPIFailure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"message":"domain not verified"}`))
	}))
	defer srv.Close()
	orig := resendEndpoint
	resendEndpoint = srv.URL
	defer func() { resendEndpoint = orig }()

	s := &ResendSender{apiKey: "re_test", cfg: Config{FromAddress: "a@b.com"}}
	err := s.Send(context.Background(), "x@y.com", "subj", "<p>h</p>", "t")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "domain not verified")
}
