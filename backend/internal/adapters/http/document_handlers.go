package http

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	datePatterns = []*regexp.Regexp{
		regexp.MustCompile(`\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b`),
		regexp.MustCompile(`\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b`),
		regexp.MustCompile(`\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b`),
		regexp.MustCompile(`\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b`),
		regexp.MustCompile(`\b(Q[1-4]\s+\d{4})\b`),
		regexp.MustCompile(`\b(FY\s*\d{4}|fiscal\s+year\s+\d{4})\b`),
	}

	currencyPattern = regexp.MustCompile(`\b(USD|GHS|EUR|GBP|\$|€|£)\s*[\d,]+(?:\.[\d,]+)?(?:\s*(million|billion|thousand|M|B|K))?\b|\b[\d,]+(?:\.[\d,]+)?(?:\s*(million|billion|thousand|M|B|K))?\s*(USD|GHS|EUR|GBP|dollars|cedis|euros)\b`)
	emailPattern    = regexp.MustCompile(`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`)
	phonePattern    = regexp.MustCompile(`\+?\d[\d\s\-()]{7,20}\d`)
	orgPattern      = regexp.MustCompile(`\b(Ministry of [A-Z][a-zA-Z\s]+|Department of [A-Z][a-zA-Z\s]+|National [A-Z][a-zA-Z\s]+|Ghana [A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z]+ (Ltd|Limited|Inc|Corp|PLC|LLC))\b`)
)

type ExtractedDocument struct {
	Summary      string   `json:"summary"`
	Entities     []Entity `json:"entities"`
	Dates        []string `json:"dates"`
	Obligations  []string `json:"obligations"`
	MonetaryVals []string `json:"monetary_values"`
}

type Entity struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

func handleDocumentExtract(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Text string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if len(req.Text) < 50 {
			respondError(w, http.StatusBadRequest, "text too short")
			return
		}

		result := extractFromText(req.Text)
		respondJSON(w, http.StatusOK, result)
	}
}

func extractFromText(text string) ExtractedDocument {
	sentences := splitSentences(text)
	result := ExtractedDocument{
		Entities:     []Entity{},
		Dates:        []string{},
		Obligations:  []string{},
		MonetaryVals: []string{},
	}

	// Extract dates
	seenDates := map[string]bool{}
	for _, p := range datePatterns {
		for _, m := range p.FindAllString(text, -1) {
			if !seenDates[m] {
				result.Dates = append(result.Dates, m)
				seenDates[m] = true
			}
		}
	}

	// Extract monetary values
	seenMoney := map[string]bool{}
	for _, m := range currencyPattern.FindAllString(text, -1) {
		if !seenMoney[m] {
			result.MonetaryVals = append(result.MonetaryVals, m)
			seenMoney[m] = true
		}
	}

	// Extract emails and phones
	for _, m := range emailPattern.FindAllString(text, -1) {
		result.Entities = append(result.Entities, Entity{Type: "email", Value: m})
	}
	seenPhones := map[string]bool{}
	for _, m := range phonePattern.FindAllString(text, -1) {
		if !seenPhones[m] {
			result.Entities = append(result.Entities, Entity{Type: "phone", Value: m})
			seenPhones[m] = true
		}
	}

	// Extract organizations
	seenOrgs := map[string]bool{}
	for _, m := range orgPattern.FindAllString(text, -1) {
		if !seenOrgs[m] {
			result.Entities = append(result.Entities, Entity{Type: "organization", Value: m})
			seenOrgs[m] = true
		}
	}

	// Extract obligations
	obligationKeywords := []string{"shall", "must", "will be required to", "is responsible for", "obligation to", "duty to", "required to", "agrees to", "commits to", "undertakes to"}
	for _, s := range sentences {
		lower := strings.ToLower(s)
		for _, kw := range obligationKeywords {
			if strings.Contains(lower, kw) && len(s) > 20 && len(s) < 300 {
				result.Obligations = append(result.Obligations, strings.TrimSpace(s))
				break
			}
		}
	}

	// Generate summary: first 2-3 substantive sentences
	var summaryParts []string
	for _, s := range sentences {
		clean := strings.TrimSpace(s)
		if len(clean) > 40 && !strings.HasPrefix(strings.ToLower(clean), "dear ") && !strings.HasPrefix(strings.ToLower(clean), "from: ") {
			summaryParts = append(summaryParts, clean)
			if len(summaryParts) >= 3 {
				break
			}
		}
	}
	result.Summary = strings.Join(summaryParts, " ")
	if result.Summary == "" && len(sentences) > 0 {
		result.Summary = sentences[0]
	}

	return result
}

func splitSentences(text string) []string {
	// Simple sentence splitter
	re := regexp.MustCompile(`[.!?]\s+`)
	parts := re.Split(text, -1)
	var sentences []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			sentences = append(sentences, p)
		}
	}
	return sentences
}
