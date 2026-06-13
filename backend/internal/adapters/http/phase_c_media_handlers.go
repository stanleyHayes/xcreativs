package http

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/pkg/storage"
)

// Audio-brief TTS pipeline (agent_plan.md §5.5), Cloudinary uploads, and
// document-intelligence file upload (§5.2). TTS is env-gated against an
// OpenAI-compatible /audio/speech endpoint and degrades to 501 when unconfigured;
// generated audio is uploaded to Cloudinary when configured.

func handleGenerateTTS(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		apiURL := strings.TrimRight(os.Getenv("TTS_API_URL"), "/")
		apiKey := os.Getenv("TTS_API_KEY")
		if apiURL == "" || apiKey == "" {
			respondError(w, http.StatusNotImplemented, "TTS is not configured (set TTS_API_URL and TTS_API_KEY)")
			return
		}
		slug := chi.URLParam(r, "slug")
		var title, transcript string
		if err := pool.QueryRow(r.Context(), `SELECT title, COALESCE(transcript,'') FROM content.audio_briefs WHERE slug = $1`, slug).Scan(&title, &transcript); err != nil {
			respondError(w, http.StatusNotFound, "audio brief not found")
			return
		}
		text := transcript
		if strings.TrimSpace(text) == "" {
			text = title
		}
		model := os.Getenv("TTS_MODEL")
		if model == "" {
			model = "tts-1"
		}
		voice := os.Getenv("TTS_VOICE")
		if voice == "" {
			voice = "alloy"
		}
		body, _ := json.Marshal(map[string]any{"model": model, "input": text, "voice": voice, "response_format": "mp3"})
		req, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, apiURL+"/audio/speech", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")
		resp, err := (&http.Client{Timeout: 60 * time.Second}).Do(req)
		if err != nil {
			respondError(w, http.StatusBadGateway, "TTS provider error")
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			respondError(w, http.StatusBadGateway, "TTS synthesis failed")
			return
		}
		audio, err := io.ReadAll(io.LimitReader(resp.Body, 25<<20))
		if err != nil || len(audio) == 0 {
			respondError(w, http.StatusBadGateway, "empty TTS response")
			return
		}
		// When Cloudinary is configured, upload the audio and persist audio_url;
		// otherwise stream the bytes back for manual hosting.
		if cld := storage.NewCloudinaryFromEnv(); cld.Configured() {
			res, err := cld.UploadBytes(r.Context(), "audio-briefs", slug, audio, "video")
			if err != nil {
				respondError(w, http.StatusBadGateway, "audio upload failed: "+err.Error())
				return
			}
			_, _ = pool.Exec(r.Context(), `UPDATE content.audio_briefs SET audio_url = $1 WHERE slug = $2`, res.SecureURL, slug)
			respondJSON(w, http.StatusOK, map[string]any{"audio_url": res.SecureURL, "bytes": res.Bytes})
			return
		}
		w.Header().Set("Content-Type", "audio/mpeg")
		w.Header().Set("Content-Disposition", `attachment; filename="`+slug+`.mp3"`)
		_, _ = w.Write(audio)
	}
}

// handleUpload uploads a multipart file to Cloudinary and returns its URL.
// Used for résumés, deliverables, and media. Returns 501 until Cloudinary is set.
func handleUpload(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cld := storage.NewCloudinaryFromEnv()
		if !cld.Configured() {
			respondError(w, http.StatusNotImplemented, "uploads not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)")
			return
		}
		if err := r.ParseMultipartForm(15 << 20); err != nil {
			respondError(w, http.StatusBadRequest, "invalid upload")
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			respondError(w, http.StatusBadRequest, "a 'file' field is required")
			return
		}
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, 15<<20))
		if err != nil {
			respondError(w, http.StatusBadRequest, "could not read file")
			return
		}
		folder := r.FormValue("folder")
		if folder == "" {
			folder = "uploads"
		}
		res, err := cld.UploadBytes(r.Context(), folder, "", data, "auto")
		if err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"url": res.SecureURL, "public_id": res.PublicID, "bytes": res.Bytes, "format": res.Format,
		})
	}
}

// --- Document intelligence: file upload ---

func handleDocumentExtractFile(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			respondError(w, http.StatusBadRequest, "invalid upload")
			return
		}
		file, hdr, err := r.FormFile("file")
		if err != nil {
			respondError(w, http.StatusBadRequest, "a 'file' field is required")
			return
		}
		defer file.Close()
		raw, err := io.ReadAll(io.LimitReader(file, 10<<20))
		if err != nil {
			respondError(w, http.StatusBadRequest, "could not read file")
			return
		}
		text := extractTextFromUpload(hdr.Filename, raw)
		if len(strings.TrimSpace(text)) < 50 {
			respondError(w, http.StatusUnprocessableEntity, "could not extract enough text (for PDFs, only uncompressed/text PDFs and .txt/.md/.csv are supported without a parser)")
			return
		}
		respondJSON(w, http.StatusOK, extractFromText(text))
	}
}

func extractTextFromUpload(name string, b []byte) string {
	if strings.HasSuffix(strings.ToLower(name), ".pdf") || bytes.HasPrefix(b, []byte("%PDF")) {
		return extractPDFTextBestEffort(b)
	}
	// text / markdown / csv / anything UTF-8.
	return string(b)
}

// extractPDFTextBestEffort pulls readable text from a PDF without a parser
// dependency: the literal strings inside content streams (works for
// uncompressed PDFs) plus any long printable runs.
func extractPDFTextBestEffort(b []byte) string {
	var sb strings.Builder
	// 1) text in ( ... ) Tj / TJ operators
	for i := 0; i < len(b); i++ {
		if b[i] == '(' {
			j := i + 1
			var run []byte
			for j < len(b) && b[j] != ')' {
				if b[j] == '\\' && j+1 < len(b) {
					j++
				}
				if b[j] >= 32 && b[j] < 127 {
					run = append(run, b[j])
				}
				j++
			}
			if len(run) >= 2 {
				sb.Write(run)
				sb.WriteByte(' ')
			}
			i = j
		}
	}
	if sb.Len() >= 50 {
		return sb.String()
	}
	// 2) fallback: long printable ASCII runs
	var run []rune
	var out strings.Builder
	flush := func() {
		if len(run) >= 6 {
			out.WriteString(string(run))
			out.WriteByte(' ')
		}
		run = run[:0]
	}
	for _, r := range string(b) {
		if r < 128 && (unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) || strings.ContainsRune(".,;:!?-/()$%&", r)) {
			run = append(run, r)
		} else {
			flush()
		}
	}
	flush()
	return out.String()
}
