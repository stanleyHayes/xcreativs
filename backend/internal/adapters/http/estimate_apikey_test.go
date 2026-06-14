package http

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestComputeEstimate(t *testing.T) {
	// Unknown service line normalizes to strategy_advisory.
	line, _, _, _, _, _ := computeEstimate("totally_unknown_line", map[string]any{})
	assert.Equal(t, "strategy_advisory", line)

	// Known line, no multipliers -> base band (strategic_web_platforms: $45k–$150k, 8–20 weeks).
	line, weeks, usd, ghs, _, _ := computeEstimate("strategic_web_platforms", map[string]any{})
	assert.Equal(t, "strategic_web_platforms", line)
	assert.Equal(t, "8–20 weeks", weeks)
	assert.True(t, strings.HasPrefix(usd, "$"))
	assert.Contains(t, usd, "–")
	assert.True(t, strings.HasPrefix(ghs, "₵"))

	// Higher complexity raises the price above the base band.
	_, _, usdComplex, _, _, _ := computeEstimate("strategic_web_platforms", map[string]any{
		"integrations":     float64(12),         // 1.6x
		"compliance":       "national_security", // 1.6x
		"ai_needs":         "advanced",          // 1.4x
		"user_count":       float64(20000),      // 1.5x
		"timeline_urgency": "critical",          // 1.35x
		"data_volume":      "enterprise",        // 1.5x
	})
	assert.True(t, strings.HasPrefix(usdComplex, "$"))
	assert.NotEqual(t, usd, usdComplex, "multipliers should change the price band")

	// Weeks are capped at 52 even for maximal complexity.
	_, weeksCapped, _, _, _, _ := computeEstimate("enterprise_government_systems", map[string]any{
		"integrations":     float64(20),
		"compliance":       "national_security",
		"ai_needs":         "advanced",
		"user_count":       float64(50000),
		"timeline_urgency": "critical",
		"data_volume":      "enterprise",
	})
	assert.Contains(t, weeksCapped, "52", "max weeks should be capped at 52")
	assert.Contains(t, weeksCapped, "weeks")

	// Component phase ranges must be non-inverted and monotonic even for the
	// smallest service line (digital_systems_audit, base weeks {2,6}) — this is
	// the "weeks 1–0" regression guard.
	_, _, _, _, comps, _ := computeEstimate("digital_systems_audit", map[string]any{})
	assert.Len(t, comps, 4)
	prevEnd := 0
	for _, c := range comps {
		m, ok := c.(map[string]string)
		assert.True(t, ok)
		parts := strings.Split(strings.TrimPrefix(m["phase"], "weeks "), "–")
		assert.Len(t, parts, 2, "phase %q", m["phase"])
		lo, e1 := strconv.Atoi(strings.TrimSpace(parts[0]))
		hi, e2 := strconv.Atoi(strings.TrimSpace(parts[1]))
		assert.NoError(t, e1)
		assert.NoError(t, e2)
		assert.LessOrEqual(t, lo, hi, "phase range inverted: %q", m["phase"])
		assert.Greater(t, lo, prevEnd, "phases not monotonic: %q after end %d", m["phase"], prevEnd)
		prevEnd = hi
	}
}

func TestGenerateAPIKey(t *testing.T) {
	full, prefix, hash, err := generateAPIKey()
	assert.NoError(t, err)

	// Format: "xc_" + 32 random bytes hex-encoded (64 chars) = 67 chars.
	assert.True(t, strings.HasPrefix(full, "xc_"))
	assert.Len(t, full, 67)

	// Prefix is the first 12 chars, surfaced to users for identification.
	assert.Equal(t, full[:12], prefix)
	assert.Len(t, prefix, 12)

	// Stored hash is sha256(full), hex (64 chars) — the raw key is never stored.
	assert.Len(t, hash, 64)
	h := sha256.Sum256([]byte(full))
	assert.Equal(t, hex.EncodeToString(h[:]), hash)

	// Each call is unique (random source).
	full2, _, hash2, err2 := generateAPIKey()
	assert.NoError(t, err2)
	assert.NotEqual(t, full, full2)
	assert.NotEqual(t, hash, hash2)
}
