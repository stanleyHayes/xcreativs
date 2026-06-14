package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EngagementAccessMiddleware guards the /portal/engagements/{id} subtree: the
// caller must own the engagement (client_id) or be a team member on it, with an
// admin bypass. Without this, any authenticated user (e.g. a self-registered
// "viewer") could read or mutate ANY engagement's data by guessing its UUID —
// a cross-tenant IDOR. Mounted via eng.Use(...) so {id} is already captured.
//
// Unknown / unauthorized ids return 404 (not 403) so engagement UUIDs can't be
// enumerated by distinguishing "exists but forbidden" from "does not exist".
func EngagementAccessMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			if id == "" {
				next.ServeHTTP(w, r)
				return
			}
			// Admins (internal staff) may access any engagement.
			if role, _ := r.Context().Value(userRoleKey).(string); role == "admin" {
				next.ServeHTTP(w, r)
				return
			}
			uid, _ := r.Context().Value(userIDKey).(string)
			if uid == "" {
				respondError(w, http.StatusForbidden, "forbidden")
				return
			}
			var ok bool
			err := pool.QueryRow(r.Context(), `
				SELECT EXISTS (
					SELECT 1 FROM engagement.engagements e
					WHERE e.id = $1::uuid AND (
						e.client_id = $2::uuid
						OR EXISTS (
							SELECT 1 FROM engagement.team_members tm
							WHERE tm.engagement_id = e.id AND tm.user_id = $2::uuid
						)
					)
				)`, id, uid).Scan(&ok)
			if err != nil || !ok {
				respondError(w, http.StatusNotFound, "engagement not found")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
