package domain

import (
	"time"

	"github.com/google/uuid"
)

// Page represents a CMS-managed page.
type Page struct {
	ID              uuid.UUID
	Slug            string
	Title           string
	TitleFR         string
	MetaDescription string
	MetaDescriptionFR string
	Data            map[string]any
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Service represents a service line.
type Service struct {
	ID                  uuid.UUID
	Slug                string
	ServiceLine         string
	Title               string
	TitleFR             string
	Summary             string
	SummaryFR           string
	Methodology         []any
	Deliverables        []any
	IndicativeTimeline  string
	IndicativePriceBand string
	FAQs                []any
	HeroImageURL        string
	SortOrder           int
	Status              string
}

// LabsProduct represents a Labs product like ILIVVON.
type LabsProduct struct {
	ID                           uuid.UUID
	Slug                         string
	Name                         string
	NameFR                       string
	Tagline                      string
	TaglineFR                    string
	ProblemStatement             string
	ProblemStatementFR           string
	PlatformDescription          string
	PlatformDescriptionFR        string
	TechnicalArchitectureOverview string
	Sectors                      []string
	Screenshots                  []any
	RequestAccessForm            map[string]any
	SortOrder                    int
	Status                       string
}

// Subsidiary represents a subsidiary in the holding company.
type Subsidiary struct {
	ID                   uuid.UUID
	Slug                 string
	Name                 string
	NameFR               string
	Description          string
	DescriptionFR        string
	Status               string
	Leadership           []any
	RelationshipToParent string
	SortOrder            int
}

// CaseDossier represents a case study.
type CaseDossier struct {
	ID                uuid.UUID
	Slug              string
	Title             string
	TitleFR           string
	ClientName        string
	Industry          string
	ServiceLine       string
	Scale             string
	Stage             string
	Brief             string
	BriefFR           string
	ConstraintSet     string
	ConstraintSetFR   string
	ArchitectureChosen string
	ArchitectureChosenFR string
	WhatShipped       string
	WhatShippedFR     string
	IPRetained        string
	IPRetainedFR      string
	Learnings         string
	LearningsFR       string
	Anonymized        bool
	CoverImageURL     string
	SortOrder         int
	Status            string
}

// Industry represents a sector page.
type Industry struct {
	ID                  uuid.UUID
	Slug                string
	Sector              string
	Title               string
	TitleFR             string
	Description         string
	DescriptionFR       string
	CapabilityMapping   []any
	RelevantDossierSlugs []string
	IntakeCTAText       string
	IntakeCTATextFR     string
	SortOrder           int
	Status              string
}

// Insight represents a piece of knowledge content.
type Insight struct {
	ID           uuid.UUID
	Slug         string
	ContentType  string
	Title        string
	TitleFR      string
	Summary      string
	SummaryFR    string
	Body         string
	BodyFR       string
	AuthorName   string
	AuthorTitle  string
	Tags         []string
	IsGated      bool
	GatedPDFURL  string
	AudioURL     string
	PublishedAt  *time.Time
	Status       string
}

// GlossaryTerm represents a glossary entry.
type GlossaryTerm struct {
	ID            uuid.UUID
	Term          string
	TermFR        string
	Definition    string
	DefinitionFR  string
	RelatedTerms  []string
	SortOrder     int
}

// FAQ represents a frequently asked question.
type FAQ struct {
	ID         uuid.UUID
	Category   string
	CategoryFR string
	Question   string
	QuestionFR string
	Answer     string
	AnswerFR   string
	SortOrder  int
}

// PressRelease represents a press release or media coverage.
type PressRelease struct {
	ID          uuid.UUID
	Slug        string
	Title       string
	TitleFR     string
	Body        string
	BodyFR      string
	PublishedAt *time.Time
	IsCoverage  bool
	SourceName  string
	SourceURL   string
	Status      string
}

// MediaKitAsset represents a downloadable media asset.
type MediaKitAsset struct {
	ID         uuid.UUID
	AssetType  string
	Name       string
	DownloadURL string
	SortOrder  int
}

// LiveTicker holds aggregate metrics for the public ticker.
type LiveTicker struct {
	ActiveEngagements   int
	SectorsCovered      int
	CapabilitiesDeployed int
	TotalDeliverables   int
}

// ReadingListItem represents a curated external reading with annotation.
type ReadingListItem struct {
	ID                uuid.UUID
	Slug              string
	Title             string
	Author            string
	SourcePublication string
	SourceURL         string
	PublishedYear     int
	Annotation        string
	KeyTakeaway       string
	Category          string
	Tags              []string
	CoverImageURL     string
	ReadTimeMinutes   int
	Recommended       bool
	Status            string
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// AudioBrief represents a short-form audio content piece.
type AudioBrief struct {
	ID              uuid.UUID
	Slug            string
	Title           string
	Summary         string
	DurationSeconds int
	AudioURL        string
	Transcript      string
	SpeakerName     string
	SpeakerTitle    string
	Tags            []string
	CoverImageURL   string
	PublishedAt     *time.Time
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Webinar represents a live or recorded webinar event.
type Webinar struct {
	ID              uuid.UUID
	Slug            string
	Title           string
	Description     string
	ScheduledAt     time.Time
	DurationMinutes int
	RecordingURL    string
	RegistrationURL string
	MaxAttendees    int
	SpeakerNames    []string
	Tags            []string
	CoverImageURL   string
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// WebinarRegistration represents an attendee registration for a webinar.
type WebinarRegistration struct {
	ID           uuid.UUID
	WebinarID    uuid.UUID
	Email        string
	FirstName    string
	LastName     string
	Organization string
	Attended     bool
	RegisteredAt time.Time
}
