package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

func handleListPages(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status")
		pages, err := deps.Content.ListPages(r.Context(), status)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list pages")
			return
		}
		respondJSON(w, http.StatusOK, pages)
	}
}

func handleGetPage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")
		page, err := deps.Content.GetPageBySlug(r.Context(), slug)
		if err != nil {
			respondError(w, http.StatusNotFound, "page not found")
			return
		}
		respondJSON(w, http.StatusOK, page)
	}
}

func handleCreatePage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Slug              string         `json:"slug"`
			Title             string         `json:"title"`
			TitleFR           string         `json:"title_fr"`
			MetaDescription   string         `json:"meta_description"`
			MetaDescriptionFR string         `json:"meta_description_fr"`
			Data              map[string]any `json:"data"`
			Status            string         `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		v := NewValidator()
		v.Required("slug", req.Slug, "slug is required")
		v.Required("title", req.Title, "title is required")
		v.Required("status", req.Status, "status is required")
		v.In("status", req.Status, "published", "draft")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		page := &domain.Page{
			ID:                uuid.New(),
			Slug:              req.Slug,
			Title:             req.Title,
			TitleFR:           req.TitleFR,
			MetaDescription:   req.MetaDescription,
			MetaDescriptionFR: req.MetaDescriptionFR,
			Data:              req.Data,
			Status:            req.Status,
		}
		if err := deps.Content.CreatePage(r.Context(), page); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create page")
			return
		}
		respondJSON(w, http.StatusCreated, page)
	}
}

func handleUpdatePage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		id, err := uuid.Parse(idStr)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid page id")
			return
		}

		var req struct {
			Slug              string         `json:"slug"`
			Title             string         `json:"title"`
			TitleFR           string         `json:"title_fr"`
			MetaDescription   string         `json:"meta_description"`
			MetaDescriptionFR string         `json:"meta_description_fr"`
			Data              map[string]any `json:"data"`
			Status            string         `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		v := NewValidator()
		v.Required("slug", req.Slug, "slug is required")
		v.Required("title", req.Title, "title is required")
		v.Required("status", req.Status, "status is required")
		v.In("status", req.Status, "published", "draft")
		if !v.Valid() {
			for _, msg := range v.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		page := &domain.Page{
			ID:                id,
			Slug:              req.Slug,
			Title:             req.Title,
			TitleFR:           req.TitleFR,
			MetaDescription:   req.MetaDescription,
			MetaDescriptionFR: req.MetaDescriptionFR,
			Data:              req.Data,
			Status:            req.Status,
		}
		if err := deps.Content.UpdatePage(r.Context(), page); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update page")
			return
		}
		respondJSON(w, http.StatusOK, page)
	}
}

func handleDeletePage(pool *pgxpool.Pool) http.HandlerFunc {
	deps := NewHandlerDependencies(pool)
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := chi.URLParam(r, "id")
		if _, err := uuid.Parse(idStr); err != nil {
			respondError(w, http.StatusBadRequest, "invalid page id")
			return
		}
		if err := deps.Content.DeletePage(r.Context(), idStr); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to delete page")
			return
		}
		respondJSON(w, http.StatusNoContent, nil)
	}
}
