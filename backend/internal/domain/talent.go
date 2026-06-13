package domain

import (
	"time"

	"github.com/google/uuid"
)

// JobRole represents an open position.
type JobRole struct {
	ID                      uuid.UUID
	Slug                    string
	Title                   string
	TitleFR                 string
	Department              string
	Location                string
	IsRemoteFriendly        bool
	EmploymentType          string
	Summary                 string
	SummaryFR               string
	Responsibilities        []any
	Requirements            []any
	CompensationPhilosophy  string
	GrowthTrajectory        string
	ProjectExamples         []any
	TeamDescription         string
	ApplicationProcess      string
	ExpectedStartWindow     string
	IsOpen                  bool
	PublishedAt             *time.Time
}

// Application represents a job application.
type Application struct {
	ID            uuid.UUID
	RoleID        *uuid.UUID
	ApplicantName string
	ApplicantEmail string
	ApplicantPhone string
	ResumeURL     string
	CoverLetter   string
	PortfolioURL  string
	LinkedInURL   string
	Answers       map[string]any
	Status        string
	Notes         string
	ReviewedBy    *uuid.UUID
	ReviewedAt    *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// TalentNetworkMember represents a talent network signup.
type TalentNetworkMember struct {
	ID             uuid.UUID
	Email          string
	FirstName      string
	LastName       string
	Domains        []string
	SeniorityLevel string
	LinkedInURL    string
	PortfolioURL   string
	Bio            string
	IsActive       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// InternshipProgram represents an internship or fellowship.
type InternshipProgram struct {
	ID                uuid.UUID
	Slug              string
	Title             string
	TitleFR           string
	ProgramType       string
	DurationMonths    int
	Description       string
	DescriptionFR     string
	LearningOutcomes  []any
	IsOpen            bool
	ApplicationDeadline *time.Time
}
