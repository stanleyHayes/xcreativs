package http

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// ConciergeEngine generates responses using the knowledge base.
type ConciergeEngine struct {
	repo domain.ConciergeRepository
}

func NewConciergeEngine(repo domain.ConciergeRepository) *ConciergeEngine {
	return &ConciergeEngine{repo: repo}
}

func (e *ConciergeEngine) Respond(ctx context.Context, query string) domain.ConciergeResponse {
	// Search knowledge base
	entries, err := e.repo.SearchKnowledgeBase(ctx, query)
	if err != nil || len(entries) == 0 {
		return domain.ConciergeResponse{
			Answer:     "I don't have a specific answer for that yet. Would you like me to connect you with the right team member?",
			Confidence: 0,
			Escalate:   true,
		}
	}

	// Use the top match
	top := entries[0]
	confidence := 0.7
	if len(entries) > 1 {
		confidence = 0.85
	}

	// Build related pages
	var related []string
	for _, slug := range top.RelatedSlugs {
		related = append(related, "/"+slug)
	}

	return domain.ConciergeResponse{
		Answer:       top.Answer,
		RelatedPages: related,
		Confidence:   confidence,
		Escalate:     false,
	}
}

// --- Public & Authenticated Chat APIs ---

func handleStartChat(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			VisitorID string `json:"visitor_id"`
			Subject   string `json:"subject"`
			Source    string `json:"source"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req) // body optional; fields default below
		if req.Source == "" {
			req.Source = "public"
		}

		session := &domain.ChatSession{
			VisitorID: req.VisitorID,
			Source:    req.Source,
			Status:    "active",
			Subject:   req.Subject,
		}

		// If authenticated, link to user
		if userID, ok := r.Context().Value(userIDKey).(string); ok && userID != "" {
			uid, _ := uuid.Parse(userID)
			session.UserID = &uid
		}

		s, err := deps.Concierge.CreateChatSession(r.Context(), session)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to start chat")
			return
		}

		// Add welcome message
		welcome := "Hello, I'm XC Assistant. I can answer questions about XCreativs Technologies, our services, Labs products, partnerships, and careers. What would you like to know?"
		_ = deps.Concierge.CreateChatMessage(r.Context(), &domain.ChatMessage{
			SessionID: s.ID,
			Role:      "assistant",
			Content:   welcome,
		})

		respondJSON(w, http.StatusCreated, map[string]any{
			"session_id": s.ID,
			"welcome":    welcome,
		})
	}
}

func handleSendMessage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "session_id")
		var req struct {
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Content == "" {
			respondError(w, http.StatusBadRequest, "content required")
			return
		}

		// Verify session exists
		session, err := deps.Concierge.GetChatSession(r.Context(), sessionID)
		if err != nil || session == nil {
			respondError(w, http.StatusNotFound, "session not found")
			return
		}

		// Store user message
		_ = deps.Concierge.CreateChatMessage(r.Context(), &domain.ChatMessage{
			SessionID: session.ID,
			Role:      "user",
			Content:   req.Content,
		})

		// Generate response (retrieval-augmented over the CMS corpus)
		resp := ragRespond(r.Context(), pool, deps.Concierge, req.Content)

		// Store assistant message
		metadata := map[string]any{}
		if len(resp.RelatedPages) > 0 {
			metadata["related_pages"] = resp.RelatedPages
		}
		metadata["confidence"] = resp.Confidence
		_ = deps.Concierge.CreateChatMessage(r.Context(), &domain.ChatMessage{
			SessionID: session.ID,
			Role:      "assistant",
			Content:   resp.Answer,
			Metadata:  metadata,
		})

		// Update session if escalated
		if resp.Escalate {
			_ = deps.Concierge.UpdateChatSessionStatus(r.Context(), sessionID, "escalated")
		}

		respondJSON(w, http.StatusOK, map[string]any{
			"answer":        resp.Answer,
			"related_pages": resp.RelatedPages,
			"confidence":    resp.Confidence,
			"escalate":      resp.Escalate,
		})
	}
}

func handleGetChatHistory(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "session_id")
		messages, err := deps.Concierge.ListChatMessages(r.Context(), sessionID, 100)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to load messages")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"messages": messages})
	}
}

func handleCloseChat(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		sessionID := chi.URLParam(r, "session_id")
		if err := deps.Concierge.CloseChatSession(r.Context(), sessionID); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to close session")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "closed"})
	}
}

func handleListChatSessions(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := ""
		if uid, ok := r.Context().Value(userIDKey).(string); ok {
			userID = uid
		}
		visitorID := r.URL.Query().Get("visitor_id")
		sessions, err := deps.Concierge.ListChatSessions(r.Context(), userID, visitorID, 20)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list sessions")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"sessions": sessions})
	}
}
