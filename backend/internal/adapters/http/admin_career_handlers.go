package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

const adminJobRoleSelectColumns = `
	id, slug, title, COALESCE(title_fr, '') AS title_fr, department,
	COALESCE(location, '') AS location, is_remote_friendly, employment_type,
	summary, COALESCE(summary_fr, '') AS summary_fr, responsibilities,
	requirements, COALESCE(compensation_philosophy, '') AS compensation_philosophy,
	COALESCE(growth_trajectory, '') AS growth_trajectory, project_examples,
	COALESCE(team_description, '') AS team_description,
	COALESCE(application_process, '') AS application_process,
	COALESCE(expected_start_window, '') AS expected_start_window,
	is_open, published_at
`

type jobRoleScanner interface {
	Scan(dest ...any) error
}

type careerRoleRequest struct {
	Slug                   string   `json:"slug"`
	Title                  string   `json:"title"`
	TitleFR                string   `json:"title_fr"`
	Department             string   `json:"department"`
	Location               string   `json:"location"`
	IsRemoteFriendly       *bool    `json:"is_remote_friendly"`
	EmploymentType         string   `json:"employment_type"`
	Summary                string   `json:"summary"`
	SummaryFR              string   `json:"summary_fr"`
	Responsibilities       []string `json:"responsibilities"`
	Requirements           []string `json:"requirements"`
	CompensationPhilosophy string   `json:"compensation_philosophy"`
	GrowthTrajectory       string   `json:"growth_trajectory"`
	ProjectExamples        []string `json:"project_examples"`
	TeamDescription        string   `json:"team_description"`
	ApplicationProcess     string   `json:"application_process"`
	ExpectedStartWindow    string   `json:"expected_start_window"`
	IsOpen                 *bool    `json:"is_open"`
}

type normalizedCareerRole struct {
	Slug                   string
	Title                  string
	TitleFR                string
	Department             string
	Location               string
	IsRemoteFriendly       bool
	EmploymentType         string
	Summary                string
	SummaryFR              string
	ResponsibilitiesJSON   string
	RequirementsJSON       string
	CompensationPhilosophy string
	GrowthTrajectory       string
	ProjectExamplesJSON    string
	TeamDescription        string
	ApplicationProcess     string
	ExpectedStartWindow    string
	IsOpen                 bool
}

func handleListJobRolesAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT `+adminJobRoleSelectColumns+`
			FROM talent.job_roles
			ORDER BY is_open DESC, published_at DESC NULLS LAST, updated_at DESC
		`)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list roles")
			return
		}
		defer rows.Close()

		roles := []domain.JobRole{}
		for rows.Next() {
			role, err := scanAdminJobRole(rows)
			if err != nil {
				respondError(w, http.StatusInternalServerError, "failed to scan role")
				return
			}
			roles = append(roles, *role)
		}
		if err := rows.Err(); err != nil {
			respondError(w, http.StatusInternalServerError, "failed to list roles")
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"roles": roles})
	}
}

func handleCreateJobRoleAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req careerRoleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		roleInput, validator := normalizeCareerRoleRequest(req)
		if !validator.Valid() {
			for _, msg := range validator.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		role, err := scanAdminJobRole(pool.QueryRow(r.Context(), `
			INSERT INTO talent.job_roles (
				slug, title, title_fr, department, location, is_remote_friendly,
				employment_type, summary, summary_fr, responsibilities, requirements,
				compensation_philosophy, growth_trajectory, project_examples,
				team_description, application_process, expected_start_window,
				is_open, published_at, created_at, updated_at
			)
			VALUES (
				$1, $2, NULLIF($3, ''), $4, NULLIF($5, ''), $6,
				$7, $8, NULLIF($9, ''), $10::jsonb, $11::jsonb,
				NULLIF($12, ''), NULLIF($13, ''), $14::jsonb,
				NULLIF($15, ''), NULLIF($16, ''), NULLIF($17, ''),
				$18, CASE WHEN $18 THEN NOW() ELSE NULL END, NOW(), NOW()
			)
			RETURNING `+adminJobRoleSelectColumns,
			roleInput.Slug,
			roleInput.Title,
			roleInput.TitleFR,
			roleInput.Department,
			roleInput.Location,
			roleInput.IsRemoteFriendly,
			roleInput.EmploymentType,
			roleInput.Summary,
			roleInput.SummaryFR,
			roleInput.ResponsibilitiesJSON,
			roleInput.RequirementsJSON,
			roleInput.CompensationPhilosophy,
			roleInput.GrowthTrajectory,
			roleInput.ProjectExamplesJSON,
			roleInput.TeamDescription,
			roleInput.ApplicationProcess,
			roleInput.ExpectedStartWindow,
			roleInput.IsOpen,
		))
		if err != nil {
			respondError(w, http.StatusInternalServerError, "failed to create role")
			return
		}
		respondJSON(w, http.StatusCreated, role)
	}
}

func handleUpdateJobRoleAdmin(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid role id")
			return
		}

		var req careerRoleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		roleInput, validator := normalizeCareerRoleRequest(req)
		if !validator.Valid() {
			for _, msg := range validator.Errors {
				respondError(w, http.StatusBadRequest, msg)
				return
			}
		}

		role, err := scanAdminJobRole(pool.QueryRow(r.Context(), `
			UPDATE talent.job_roles
			SET slug = $2,
				title = $3,
				title_fr = NULLIF($4, ''),
				department = $5,
				location = NULLIF($6, ''),
				is_remote_friendly = $7,
				employment_type = $8,
				summary = $9,
				summary_fr = NULLIF($10, ''),
				responsibilities = $11::jsonb,
				requirements = $12::jsonb,
				compensation_philosophy = NULLIF($13, ''),
				growth_trajectory = NULLIF($14, ''),
				project_examples = $15::jsonb,
				team_description = NULLIF($16, ''),
				application_process = NULLIF($17, ''),
				expected_start_window = NULLIF($18, ''),
				is_open = $19,
				published_at = CASE WHEN $19 THEN COALESCE(published_at, NOW()) ELSE NULL END,
				updated_at = NOW()
			WHERE id = $1
			RETURNING `+adminJobRoleSelectColumns,
			id,
			roleInput.Slug,
			roleInput.Title,
			roleInput.TitleFR,
			roleInput.Department,
			roleInput.Location,
			roleInput.IsRemoteFriendly,
			roleInput.EmploymentType,
			roleInput.Summary,
			roleInput.SummaryFR,
			roleInput.ResponsibilitiesJSON,
			roleInput.RequirementsJSON,
			roleInput.CompensationPhilosophy,
			roleInput.GrowthTrajectory,
			roleInput.ProjectExamplesJSON,
			roleInput.TeamDescription,
			roleInput.ApplicationProcess,
			roleInput.ExpectedStartWindow,
			roleInput.IsOpen,
		))
		if err != nil {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		respondJSON(w, http.StatusOK, role)
	}
}

func normalizeCareerRoleRequest(req careerRoleRequest) (normalizedCareerRole, *Validator) {
	title := strings.TrimSpace(req.Title)
	slug := normalizeCareerRoleSlug(req.Slug)
	if slug == "" {
		slug = normalizeCareerRoleSlug(title)
	}
	employmentType := strings.TrimSpace(req.EmploymentType)
	if employmentType == "" {
		employmentType = "full_time"
	}
	isRemoteFriendly := true
	if req.IsRemoteFriendly != nil {
		isRemoteFriendly = *req.IsRemoteFriendly
	}
	isOpen := true
	if req.IsOpen != nil {
		isOpen = *req.IsOpen
	}

	role := normalizedCareerRole{
		Slug:                   slug,
		Title:                  title,
		TitleFR:                strings.TrimSpace(req.TitleFR),
		Department:             strings.TrimSpace(req.Department),
		Location:               strings.TrimSpace(req.Location),
		IsRemoteFriendly:       isRemoteFriendly,
		EmploymentType:         employmentType,
		Summary:                strings.TrimSpace(req.Summary),
		SummaryFR:              strings.TrimSpace(req.SummaryFR),
		ResponsibilitiesJSON:   marshalStringList(cleanStringList(req.Responsibilities)),
		RequirementsJSON:       marshalStringList(cleanStringList(req.Requirements)),
		CompensationPhilosophy: strings.TrimSpace(req.CompensationPhilosophy),
		GrowthTrajectory:       strings.TrimSpace(req.GrowthTrajectory),
		ProjectExamplesJSON:    marshalStringList(cleanStringList(req.ProjectExamples)),
		TeamDescription:        strings.TrimSpace(req.TeamDescription),
		ApplicationProcess:     strings.TrimSpace(req.ApplicationProcess),
		ExpectedStartWindow:    strings.TrimSpace(req.ExpectedStartWindow),
		IsOpen:                 isOpen,
	}

	v := NewValidator()
	v.Required("slug", role.Slug, "slug is required")
	v.Required("title", role.Title, "title is required")
	v.Required("department", role.Department, "department is required")
	v.Required("summary", role.Summary, "summary is required")
	return role, v
}

func scanAdminJobRole(row jobRoleScanner) (*domain.JobRole, error) {
	role := &domain.JobRole{}
	var responsibilities, requirements, projectExamples []byte
	err := row.Scan(
		&role.ID,
		&role.Slug,
		&role.Title,
		&role.TitleFR,
		&role.Department,
		&role.Location,
		&role.IsRemoteFriendly,
		&role.EmploymentType,
		&role.Summary,
		&role.SummaryFR,
		&responsibilities,
		&requirements,
		&role.CompensationPhilosophy,
		&role.GrowthTrajectory,
		&projectExamples,
		&role.TeamDescription,
		&role.ApplicationProcess,
		&role.ExpectedStartWindow,
		&role.IsOpen,
		&role.PublishedAt,
	)
	if err != nil {
		return nil, err
	}
	role.Responsibilities = decodeJobRoleList(responsibilities)
	role.Requirements = decodeJobRoleList(requirements)
	role.ProjectExamples = decodeJobRoleList(projectExamples)
	return role, nil
}

func decodeJobRoleList(raw []byte) []any {
	values := []any{}
	_ = json.Unmarshal(raw, &values)
	return values
}

func marshalStringList(values []string) string {
	raw, _ := json.Marshal(values)
	return string(raw)
}

func cleanStringList(values []string) []string {
	clean := []string{}
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			clean = append(clean, trimmed)
		}
	}
	return clean
}

func normalizeCareerRoleSlug(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var builder strings.Builder
	lastWasDash := false
	for _, r := range value {
		isAlpha := r >= 'a' && r <= 'z'
		isDigit := r >= '0' && r <= '9'
		if isAlpha || isDigit {
			builder.WriteRune(r)
			lastWasDash = false
			continue
		}
		if builder.Len() > 0 && !lastWasDash {
			builder.WriteByte('-')
			lastWasDash = true
		}
	}
	return strings.Trim(builder.String(), "-")
}
