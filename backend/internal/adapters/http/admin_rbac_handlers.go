package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// validUserRoles mirrors the user_role enum (migrations/001_enums.up.sql).
var validUserRoles = map[string]bool{
	"admin": true, "editor": true, "viewer": true, "executive": true, "project": true,
}

// handleListUsersAdmin lists all users for the admin Access-management surface.
func handleListUsersAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := strings.TrimSpace(r.URL.Query().Get("q"))
		roleFilter := strings.TrimSpace(r.URL.Query().Get("role"))
		rows, err := pool.Query(r.Context(), `
			SELECT id::text, email,
			       trim(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS name,
			       role::text, is_active,
			       COALESCE(last_login_at::text, '') AS last_login_at,
			       mfa_enabled, created_at::text
			FROM identity.users
			WHERE ($1 = '' OR email ILIKE '%' || $1 || '%'
			       OR (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) ILIKE '%' || $1 || '%')
			  AND ($2 = '' OR role::text = $2)
			ORDER BY created_at DESC
		`, q, roleFilter)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list users")
			return
		}
		defer rows.Close()
		type adminUser struct {
			ID          string `json:"id"`
			Email       string `json:"email"`
			Name        string `json:"name"`
			Role        string `json:"role"`
			IsActive    bool   `json:"is_active"`
			LastLoginAt string `json:"last_login_at"`
			MFAEnabled  bool   `json:"mfa_enabled"`
			CreatedAt   string `json:"created_at"`
		}
		users := []adminUser{}
		for rows.Next() {
			var u adminUser
			if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsActive, &u.LastLoginAt, &u.MFAEnabled, &u.CreatedAt); err != nil {
				respondError(w, http.StatusInternalServerError, "failed to read users")
				return
			}
			users = append(users, u)
		}
		if rows.Err() != nil {
			respondError(w, http.StatusInternalServerError, "failed to read users")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"users": users})
	}
}

// handleUpdateUserAdmin changes a user's role and/or active status. Self-edits
// are blocked so an admin can't lock themselves out.
func handleUpdateUserAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if _, err := uuid.Parse(id); err != nil {
			respondError(w, http.StatusBadRequest, "invalid user id")
			return
		}
		var req struct {
			Role     *string `json:"role"`
			IsActive *bool   `json:"is_active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		if req.Role == nil && req.IsActive == nil {
			respondError(w, http.StatusBadRequest, "nothing to update")
			return
		}
		if req.Role != nil && !validUserRoles[*req.Role] {
			respondError(w, http.StatusBadRequest, "invalid role")
			return
		}
		if caller, _ := r.Context().Value(userIDKey).(string); caller == id {
			respondError(w, http.StatusBadRequest, "you cannot change your own role or status")
			return
		}
		ct, err := pool.Exec(r.Context(), `
			UPDATE identity.users
			SET role = COALESCE($2::user_role, role),
			    is_active = COALESCE($3, is_active),
			    updated_at = NOW()
			WHERE id = $1
		`, id, req.Role, req.IsActive)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update user")
			return
		}
		if ct.RowsAffected() == 0 {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"status": "updated"})
	}
}

// handleListRolesAdmin returns every role (the user_role enum) with its user
// count and assigned permissions.
func handleListRolesAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT r.role,
			       (SELECT count(*) FROM identity.users u WHERE u.role::text = r.role) AS user_count,
			       COALESCE(
			         json_agg(
			           json_build_object('id', p.id, 'resource', p.resource, 'action', p.action,
			                             'description', COALESCE(p.description,''))
			           ORDER BY p.resource, p.action
			         ) FILTER (WHERE p.id IS NOT NULL),
			         '[]'
			       ) AS permissions
			FROM (SELECT unnest(enum_range(NULL::user_role))::text AS role) r
			LEFT JOIN identity.role_permissions rp ON rp.role::text = r.role
			LEFT JOIN identity.permissions p ON p.id = rp.permission_id
			GROUP BY r.role
			ORDER BY r.role
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list roles")
			return
		}
		defer rows.Close()
		type adminRole struct {
			Role        string          `json:"role"`
			UserCount   int             `json:"user_count"`
			Permissions json.RawMessage `json:"permissions"`
		}
		roles := []adminRole{}
		for rows.Next() {
			var role adminRole
			if err := rows.Scan(&role.Role, &role.UserCount, &role.Permissions); err != nil {
				respondError(w, http.StatusInternalServerError, "failed to read roles")
				return
			}
			roles = append(roles, role)
		}
		if rows.Err() != nil {
			respondError(w, http.StatusInternalServerError, "failed to read roles")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"roles": roles})
	}
}

// handleListPermissionsAdmin returns the permission catalog with how many roles
// hold each permission.
func handleListPermissionsAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT p.id::text, p.resource, p.action, COALESCE(p.description,'') AS description,
			       count(rp.role) AS role_count
			FROM identity.permissions p
			LEFT JOIN identity.role_permissions rp ON rp.permission_id = p.id
			GROUP BY p.id, p.resource, p.action, p.description
			ORDER BY p.resource, p.action
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list permissions")
			return
		}
		defer rows.Close()
		type adminPermission struct {
			ID          string `json:"id"`
			Resource    string `json:"resource"`
			Action      string `json:"action"`
			Description string `json:"description"`
			RoleCount   int    `json:"role_count"`
		}
		perms := []adminPermission{}
		for rows.Next() {
			var p adminPermission
			if err := rows.Scan(&p.ID, &p.Resource, &p.Action, &p.Description, &p.RoleCount); err != nil {
				respondError(w, http.StatusInternalServerError, "failed to read permissions")
				return
			}
			perms = append(perms, p)
		}
		if rows.Err() != nil {
			respondError(w, http.StatusInternalServerError, "failed to read permissions")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"permissions": perms})
	}
}

// handleSetRolePermissionsAdmin replaces the permission set for a role. The
// admin role is fixed (full access) and cannot be modified, preventing lockout.
func handleSetRolePermissionsAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := chi.URLParam(r, "role")
		if !validUserRoles[role] {
			respondError(w, http.StatusBadRequest, "invalid role")
			return
		}
		if role == "admin" {
			respondError(w, http.StatusForbidden, "the admin role's permissions are fixed")
			return
		}
		var req struct {
			PermissionIDs []string `json:"permission_ids"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request")
			return
		}
		tx, err := pool.Begin(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update role")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()
		if _, err := tx.Exec(r.Context(), `DELETE FROM identity.role_permissions WHERE role = $1::user_role`, role); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to update role")
			return
		}
		assigned := 0
		for _, pid := range req.PermissionIDs {
			if _, err := uuid.Parse(pid); err != nil {
				continue
			}
			if _, err := tx.Exec(r.Context(),
				`INSERT INTO identity.role_permissions (role, permission_id) VALUES ($1::user_role, $2) ON CONFLICT DO NOTHING`,
				role, pid); err != nil {
				respondError(w, http.StatusInternalServerError, "failed to assign permission")
				return
			}
			assigned++
		}
		if err := tx.Commit(r.Context()); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to commit")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"status": "updated", "count": assigned})
	}
}
