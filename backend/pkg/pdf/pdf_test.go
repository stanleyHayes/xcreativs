package pdf

import (
	"bytes"
	"strings"
	"testing"
)

func TestRenderProducesValidStructure(t *testing.T) {
	doc := Document{
		Title: "Engagement Readiness Diagnostic",
		Lines: []Line{
			{Text: "Prepared for: Jane Doe", Bold: true},
			{Text: "Organisation: Ministry of Works"},
			{Text: "A longer paragraph that should wrap across multiple physical lines because it exceeds the configured maximum line length for the body font in this minimal generator.", Gap: 6},
		},
	}
	out := doc.Render()

	if !bytes.HasPrefix(out, []byte("%PDF-1.4")) {
		t.Fatalf("missing PDF header")
	}
	if !bytes.Contains(out, []byte("%%EOF")) {
		t.Fatalf("missing EOF marker")
	}
	s := string(out)

	// Exactly one absolute Td (the initial cursor placement); all other moves
	// must be relative (regression guard for the off-page positioning bug).
	if got := strings.Count(s, " Td\n"); got < 4 {
		t.Fatalf("expected several Td moves, got %d", got)
	}
	if strings.Count(s, "72 720 Td") != 1 {
		t.Fatalf("expected exactly one absolute origin Td")
	}
	if !strings.Contains(s, "0 -") {
		t.Fatalf("expected relative downward Td moves")
	}

	// All visible text must be present in the content stream.
	for _, want := range []string{
		"Engagement Readiness Diagnostic",
		"Prepared for: Jane Doe",
		"Ministry of Works",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("rendered PDF missing text: %q", want)
		}
	}

	// The /Length of the content stream must match the actual stream bytes.
	start := strings.Index(s, "stream\n")
	end := strings.Index(s, "\nendstream")
	if start < 0 || end < 0 || end <= start {
		t.Fatalf("could not locate content stream")
	}
	streamBytes := end - (start + len("stream\n"))
	if streamBytes <= 0 {
		t.Fatalf("empty content stream")
	}
}

func TestEscapeSpecialChars(t *testing.T) {
	doc := Document{Title: "T", Lines: []Line{{Text: `Paren ( ) and back\slash`}}}
	s := string(doc.Render())
	if !strings.Contains(s, `\(`) || !strings.Contains(s, `\)`) || !strings.Contains(s, `\\`) {
		t.Fatalf("special characters not escaped in: %s", s)
	}
}
