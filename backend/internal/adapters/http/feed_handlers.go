package http

import (
	"encoding/json"
	"encoding/xml"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const insightsPathPrefix = "/insights/"

// handleDownloadInsight implements the gated-download / email-capture path for
// theses and whitepapers (agent_plan.md §3.7). It captures the prospect's email
// as an analytics lead event (no dedicated table required) and returns the
// download URL only for genuinely gated, published insights.
func handleDownloadInsight(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")

		var req struct {
			Email     string `json:"email"`
			FirstName string `json:"first_name"`
			VisitorID string `json:"visitor_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		req.Email = strings.TrimSpace(req.Email)
		if req.Email == "" {
			respondError(w, http.StatusBadRequest, "email is required")
			return
		}
		if _, err := mail.ParseAddress(req.Email); err != nil {
			respondError(w, http.StatusBadRequest, "invalid email")
			return
		}

		insight, err := deps.Content.GetInsightBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "insight not found")
			return
		}
		if !insight.IsGated {
			respondError(w, http.StatusBadRequest, "this insight is not a gated download")
			return
		}
		if insight.GatedPDFURL == "" {
			respondError(w, http.StatusNotFound, "download not available")
			return
		}

		// Capture the lead via the existing analytics pipeline (admin dashboard
		// already aggregates identity.analytics_events).
		visitor := req.VisitorID
		if visitor == "" {
			visitor = req.Email
		}
		meta := map[string]any{
			"email":        req.Email,
			"first_name":   req.FirstName,
			"slug":         slug,
			"content_type": insight.ContentType,
			"title":        insight.Title,
		}
		_, _ = pool.Exec(r.Context(), `
			INSERT INTO identity.analytics_events (event_type, visitor_id, page_path, metadata)
			VALUES ('thesis_download', $1, $2, $3)
		`, visitor, insightsPathPrefix+slug, meta)

		respondJSON(w, http.StatusOK, map[string]any{
			"download_url": insight.GatedPDFURL,
			"title":        insight.Title,
		})
	}
}

// --- Audio brief podcast feed (agent_plan.md §3.7 / §5.5) ---

type rssEnclosure struct {
	URL    string `xml:"url,attr"`
	Length int    `xml:"length,attr"`
	Type   string `xml:"type,attr"`
}

type rssItem struct {
	Title     string        `xml:"title"`
	Link      string        `xml:"link"`
	GUID      string        `xml:"guid"`
	Desc      string        `xml:"description"`
	Author    string        `xml:"itunes:author,omitempty"`
	Summary   string        `xml:"itunes:summary,omitempty"`
	Duration  string        `xml:"itunes:duration,omitempty"`
	Image     *rssItemImage `xml:"itunes:image,omitempty"`
	PubDate   string        `xml:"pubDate,omitempty"`
	Enclosure *rssEnclosure `xml:"enclosure,omitempty"`
}

type rssItemImage struct {
	Href string `xml:"href,attr"`
}

type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Language    string    `xml:"language"`
	Author      string    `xml:"itunes:author,omitempty"`
	Items       []rssItem `xml:"item"`
}

type rssFeed struct {
	XMLName xml.Name   `xml:"rss"`
	Version string     `xml:"version,attr"`
	ITunes  string     `xml:"xmlns:itunes,attr"`
	Channel rssChannel `xml:"channel"`
}

// handleAudioFeed emits an RSS 2.0 + iTunes podcast feed of published audio briefs.
func handleAudioFeed(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		briefs, err := deps.Content.ListAudioBriefs(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to build audio feed")
			return
		}

		base := strings.TrimRight(os.Getenv("BASE_URL"), "/")
		if base == "" {
			base = "https://xcreativs.com"
		}

		feed := rssFeed{
			Version: "2.0",
			ITunes:  "http://www.itunes.com/dtds/podcast-1.0.dtd",
			Channel: rssChannel{
				Title:       "XCreativs Audio Briefs",
				Link:        base + "/audio-briefs",
				Description: "Short audio briefings on intelligent digital systems for governments and enterprises, from XCreativs Technologies.",
				Language:    "en",
				Author:      "XCreativs Technologies",
			},
		}

		for _, b := range briefs {
			if b.AudioURL == "" {
				continue
			}
			item := rssItem{
				Title:    b.Title,
				Link:     base + "/audio-briefs/" + b.Slug,
				GUID:     base + "/audio-briefs/" + b.Slug,
				Desc:     b.Summary,
				Summary:  b.Summary,
				Duration: strconv.Itoa(b.DurationSeconds),
				Enclosure: &rssEnclosure{
					URL:    b.AudioURL,
					Length: 0,
					Type:   "audio/mpeg",
				},
			}
			if b.SpeakerName != "" {
				item.Author = b.SpeakerName
			}
			if b.CoverImageURL != "" {
				item.Image = &rssItemImage{Href: b.CoverImageURL}
			}
			if b.PublishedAt != nil {
				item.PubDate = b.PublishedAt.Format(time.RFC1123Z)
			}
			feed.Channel.Items = append(feed.Channel.Items, item)
		}

		out, err := xml.MarshalIndent(feed, "", "  ")
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to encode feed")
			return
		}
		w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(xml.Header))
		_, _ = w.Write(out)
	}
}

// handleInsightsFeed emits an RSS 2.0 feed of published insights (field notes,
// theses, whitepapers). agent_plan.md §3.4 marks the insights index "RSS-ready";
// this is that feed. Optional ?type= filter (field_note|thesis|whitepaper)
// mirrors the JSON list endpoint.
func handleInsightsFeed(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		contentType := r.URL.Query().Get("type")
		insights, err := deps.Content.ListInsights(r.Context(), contentType, "en")
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to build insights feed")
			return
		}

		base := strings.TrimRight(os.Getenv("BASE_URL"), "/")
		if base == "" {
			base = "https://xcreativs.com"
		}

		feed := rssFeed{
			Version: "2.0",
			ITunes:  "http://www.itunes.com/dtds/podcast-1.0.dtd",
			Channel: rssChannel{
				Title:       "XCreativs Insights",
				Link:        base + "/insights",
				Description: "Field notes, theses, and whitepapers on intelligent digital systems for governments and enterprises, from XCreativs Technologies.",
				Language:    "en",
				Author:      "XCreativs Technologies",
			},
		}

		for _, in := range insights {
			item := rssItem{
				Title:   in.Title,
				Link:    base + insightsPathPrefix + in.Slug,
				GUID:    base + insightsPathPrefix + in.Slug,
				Desc:    in.Summary,
				Summary: in.Summary,
			}
			if in.AuthorName != "" {
				item.Author = in.AuthorName
			}
			if in.PublishedAt != nil {
				item.PubDate = in.PublishedAt.Format(time.RFC1123Z)
			}
			feed.Channel.Items = append(feed.Channel.Items, item)
		}

		out, err := xml.MarshalIndent(feed, "", "  ")
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to encode feed")
			return
		}
		w.Header().Set("Content-Type", "application/rss+xml; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(xml.Header))
		_, _ = w.Write(out)
	}
}
