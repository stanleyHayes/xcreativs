package db

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	"xcreatives.com/backend/internal/domain"
)

// TalentRepo implements domain.TalentRepository.
type TalentRepo struct {
	pool *pgxpool.Pool
}

// NewTalentRepo creates a new TalentRepo.
func NewTalentRepo(pool *pgxpool.Pool) *TalentRepo {
	return &TalentRepo{pool: pool}
}

func (r *TalentRepo) ListJobRoles(ctx context.Context, isOpen bool) ([]domain.JobRole, error) {
	query := `
		SELECT id, slug, title, COALESCE(title_fr, '') AS title_fr, department, COALESCE(location, '') AS location, is_remote_friendly, employment_type, summary, COALESCE(summary_fr, '') AS summary_fr,
		       responsibilities, requirements, COALESCE(compensation_philosophy, '') AS compensation_philosophy, COALESCE(growth_trajectory, '') AS growth_trajectory, project_examples,
		       COALESCE(team_description, '') AS team_description, COALESCE(application_process, '') AS application_process, COALESCE(expected_start_window, '') AS expected_start_window, is_open, published_at
		FROM talent.job_roles
	`
	if isOpen {
		query += " WHERE is_open = TRUE"
	}
	query += " ORDER BY published_at DESC"
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []domain.JobRole
	for rows.Next() {
		jr := domain.JobRole{}
		var resp, reqs, proj []byte
		_ = rows.Scan(&jr.ID, &jr.Slug, &jr.Title, &jr.TitleFR, &jr.Department, &jr.Location, &jr.IsRemoteFriendly, &jr.EmploymentType,
			&jr.Summary, &jr.SummaryFR, &resp, &reqs, &jr.CompensationPhilosophy, &jr.GrowthTrajectory, &proj,
			&jr.TeamDescription, &jr.ApplicationProcess, &jr.ExpectedStartWindow, &jr.IsOpen, &jr.PublishedAt)
		_ = json.Unmarshal(resp, &jr.Responsibilities)
		_ = json.Unmarshal(reqs, &jr.Requirements)
		_ = json.Unmarshal(proj, &jr.ProjectExamples)
		roles = append(roles, jr)
	}
	return roles, nil
}

func (r *TalentRepo) GetJobRoleBySlug(ctx context.Context, slug string) (*domain.JobRole, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, COALESCE(title_fr, '') AS title_fr, department, COALESCE(location, '') AS location, is_remote_friendly, employment_type, summary, COALESCE(summary_fr, '') AS summary_fr,
		       responsibilities, requirements, COALESCE(compensation_philosophy, '') AS compensation_philosophy, COALESCE(growth_trajectory, '') AS growth_trajectory, project_examples,
		       COALESCE(team_description, '') AS team_description, COALESCE(application_process, '') AS application_process, COALESCE(expected_start_window, '') AS expected_start_window, is_open, published_at
		FROM talent.job_roles WHERE slug = $1
	`, slug)
	jr := &domain.JobRole{}
	var resp, reqs, proj []byte
	err := row.Scan(&jr.ID, &jr.Slug, &jr.Title, &jr.TitleFR, &jr.Department, &jr.Location, &jr.IsRemoteFriendly, &jr.EmploymentType,
		&jr.Summary, &jr.SummaryFR, &resp, &reqs, &jr.CompensationPhilosophy, &jr.GrowthTrajectory, &proj,
		&jr.TeamDescription, &jr.ApplicationProcess, &jr.ExpectedStartWindow, &jr.IsOpen, &jr.PublishedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(resp, &jr.Responsibilities)
	_ = json.Unmarshal(reqs, &jr.Requirements)
	_ = json.Unmarshal(proj, &jr.ProjectExamples)
	return jr, nil
}

func (r *TalentRepo) CreateApplication(ctx context.Context, a *domain.Application) error {
	answersJSON, _ := json.Marshal(a.Answers)
	// status is an application_status enum; never write an empty string.
	if a.Status == "" {
		a.Status = "received"
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO talent.applications (id, role_id, applicant_name, applicant_email, applicant_phone, resume_url, cover_letter, portfolio_url, linkedin_url, answers, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
	`, a.ID, a.RoleID, a.ApplicantName, a.ApplicantEmail, a.ApplicantPhone, a.ResumeURL, a.CoverLetter, a.PortfolioURL, a.LinkedInURL, answersJSON, a.Status)
	return err
}

func (r *TalentRepo) ListApplicationsByEmail(ctx context.Context, email string) ([]domain.Application, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.role_id, a.applicant_name, a.applicant_email, COALESCE(a.applicant_phone,'') AS applicant_phone, COALESCE(a.resume_url,'') AS resume_url, COALESCE(a.cover_letter,'') AS cover_letter, COALESCE(a.portfolio_url,'') AS portfolio_url, COALESCE(a.linkedin_url,'') AS linkedin_url, COALESCE(a.answers,'{}') AS answers, a.status::text AS status, COALESCE(a.notes,'') AS notes, a.reviewed_by, a.reviewed_at, a.created_at, a.updated_at, COALESCE(r.title,'') AS role_title
		FROM talent.applications a
		LEFT JOIN talent.job_roles r ON a.role_id = r.id
		WHERE a.applicant_email = $1
		ORDER BY a.created_at DESC
	`, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []domain.Application
	for rows.Next() {
		var a domain.Application
		var answers []byte
		var roleTitle string
		if err := rows.Scan(&a.ID, &a.RoleID, &a.ApplicantName, &a.ApplicantEmail, &a.ApplicantPhone, &a.ResumeURL, &a.CoverLetter, &a.PortfolioURL, &a.LinkedInURL, &answers, &a.Status, &a.Notes, &a.ReviewedBy, &a.ReviewedAt, &a.CreatedAt, &a.UpdatedAt, &roleTitle); err != nil {
			continue
		}
		_ = json.Unmarshal(answers, &a.Answers)
		if a.Answers == nil {
			a.Answers = map[string]any{}
		}
		a.Answers["_role_title"] = roleTitle
		apps = append(apps, a)
	}
	return apps, nil
}

func (r *TalentRepo) CreateTalentNetworkMember(ctx context.Context, m *domain.TalentNetworkMember) error {
	domainsJSON, _ := json.Marshal(m.Domains)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO talent.talent_network (id, email, first_name, last_name, domains, seniority_level, linkedin_url, portfolio_url, bio, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			domains = EXCLUDED.domains,
			seniority_level = EXCLUDED.seniority_level,
			linkedin_url = EXCLUDED.linkedin_url,
			portfolio_url = EXCLUDED.portfolio_url,
			bio = EXCLUDED.bio,
			is_active = EXCLUDED.is_active,
			updated_at = NOW()
	`, m.ID, m.Email, m.FirstName, m.LastName, domainsJSON, m.SeniorityLevel, m.LinkedInURL, m.PortfolioURL, m.Bio, m.IsActive)
	return err
}

func (r *TalentRepo) ListInternshipPrograms(ctx context.Context, isOpen bool) ([]domain.InternshipProgram, error) {
	query := `
		SELECT id, slug, title, COALESCE(title_fr,'') AS title_fr, program_type, duration_months, description, COALESCE(description_fr,'') AS description_fr, learning_outcomes, is_open, application_deadline
		FROM talent.internship_programs
	`
	if isOpen {
		query += " WHERE is_open = TRUE"
	}
	query += " ORDER BY application_deadline"
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programs []domain.InternshipProgram
	for rows.Next() {
		p := domain.InternshipProgram{}
		var outcomes []byte
		_ = rows.Scan(&p.ID, &p.Slug, &p.Title, &p.TitleFR, &p.ProgramType, &p.DurationMonths, &p.Description, &p.DescriptionFR, &outcomes, &p.IsOpen, &p.ApplicationDeadline)
		_ = json.Unmarshal(outcomes, &p.LearningOutcomes)
		programs = append(programs, p)
	}
	return programs, nil
}
