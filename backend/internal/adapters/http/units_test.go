package http

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOrTSQuery(t *testing.T) {
	q := orTSQuery("What services for government?")
	assert.Contains(t, q, "services:*")
	assert.Contains(t, q, "government:*")
	assert.Contains(t, q, " | ")

	// punctuation stripped, short tokens dropped
	q2 := orTSQuery("AI & data!")
	assert.Contains(t, q2, "data:*")
	assert.NotContains(t, q2, "&")
	assert.NotContains(t, q2, "ai:*") // 2 chars -> dropped

	assert.Equal(t, "", orTSQuery("a an of"))
}

func TestCommaInt(t *testing.T) {
	assert.Equal(t, "42", commaInt(42))
	assert.Equal(t, "1,000", commaInt(1000))
	assert.Equal(t, "1,234,567", commaInt(1234567))
}

func TestTruncateRunes(t *testing.T) {
	assert.Equal(t, "abc", truncateRunes("abc", 10))
	out := truncateRunes("abcdefghij", 3)
	assert.True(t, strings.HasSuffix(out, "…"))
	assert.Equal(t, "abc…", out)
}

func TestExtractPDFTextBestEffort(t *testing.T) {
	b := []byte("%PDF-1.4 stuff (Hello World) Tj more (Contract terms apply here) Tj end")
	out := extractPDFTextBestEffort(b)
	assert.Contains(t, out, "Hello World")
	assert.Contains(t, out, "Contract terms apply here")
}

func TestApplicationStatusEmail(t *testing.T) {
	subj, _, _, ok := applicationStatusEmail("Jane", "Engineer", "offer", "")
	assert.True(t, ok)
	assert.NotEmpty(t, subj)

	_, _, _, ok2 := applicationStatusEmail("Jane", "Engineer", "received", "")
	assert.False(t, ok2) // no email for the 'received' state
}

func TestCapabilityStatusValidation(t *testing.T) {
	assert.True(t, capabilityStatuses["delivered"])
	assert.True(t, capabilityStatuses["in_flight"])
	assert.False(t, capabilityStatuses["bogus"])
}
