// Shared API response types.
//
// These shapes are derived from the backend OpenAPI spec
// (backend/internal/apispec/openapi.yaml), the Go domain structs
// (backend/internal/domain), and how the frontend consumers read the data.
//
// They are intentionally permissive: list envelopes carry the fields the UI
// reads while leaving element shapes loose, and most fields are optional so
// adding a concrete return type to an API method never regresses a consumer
// that touches a field the backend may or may not send.

/** A loosely-typed JSON object returned by the backend. */
export type JSONObject = Record<string, unknown>;

/** A loosely-typed record entity (most list/detail items). */
export type Entity = Record<string, unknown>;

// ---------------------------------------------------------------------------
// List envelopes
//
// The backend wraps collections in a named array property. Consumers read that
// property and fall back to `[]`, so the property is optional and its element
// type is left loose unless a strongly-typed setter requires otherwise.
// ---------------------------------------------------------------------------

export interface EngagementsResponse {
  engagements?: Entity[];
}

export interface InvoicesResponse {
  invoices?: Entity[];
}

export interface DocumentsResponse {
  documents?: Entity[];
}

export interface ReportsResponse {
  reports?: Entity[];
}

export interface BudgetLinesResponse {
  budget_lines?: Entity[];
}

export interface DemosResponse {
  demos?: Entity[];
}

export interface ApplicationsResponse {
  applications?: Entity[];
}

export interface AssignmentsResponse {
  assignments?: Entity[];
}

export interface DecisionsResponse {
  decisions?: Entity[];
}

export interface CapabilityDeliveriesResponse {
  capability_deliveries?: Entity[];
}

export interface TeamMembersResponse {
  team_members?: Entity[];
}

export interface ThreadsResponse {
  threads?: Entity[];
}

export interface CommentsResponse {
  comments?: Entity[];
}

export interface InterviewsResponse {
  interviews?: Entity[];
}

export interface ChallengesResponse {
  challenges?: Entity[];
}

export interface WebinarsResponse {
  webinars?: Entity[];
}

export interface ReadingListResponse {
  items?: Entity[];
}

export interface PressResponse {
  press?: Entity[];
}

export interface FAQResponse {
  faqs?: Entity[];
}

export interface GlossaryResponse {
  terms?: Entity[];
}

export interface ProductsResponse {
  products?: Entity[];
}

export interface AgreementsResponse {
  agreements?: Entity[];
}

export interface ReferralsResponse {
  referrals?: Entity[];
}

export interface OrdersResponse {
  orders?: Entity[];
}

export interface WebhooksResponse {
  webhooks?: Entity[];
}

export interface WebhookDeliveriesResponse {
  deliveries?: Entity[];
}

export interface AudioBriefsResponse {
  audio_briefs?: Entity[];
}

export interface SubsidiariesResponse {
  subsidiaries?: Entity[];
}

export interface MediaKitResponse {
  assets?: Entity[];
}

export interface MyApplicationsResponse {
  applications?: Entity[];
}

export interface ApprovalWorkflowsResponse {
  workflows?: Entity[];
}

export interface PartnerApplicationsResponse {
  applications?: Entity[];
}

export interface APIKeysResponse {
  keys?: Entity[];
}

// ---------------------------------------------------------------------------
// Notifications
//
// `setNotifications` is typed `NotificationItem[]`, so the element shape must
// match the consumer's local `Notification` interface exactly (all fields
// required) for the array to be assignable.
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  channel: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications?: NotificationItem[];
}

// ---------------------------------------------------------------------------
// Search
//
// `setResults` is typed `{ public: SearchResultItem[]; portal: SearchResultItem[] }`,
// so these element fields must be present (required) to remain assignable.
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  type: string;
  slug: string;
  title: string;
  excerpt: string;
}

export interface SearchResponse {
  public?: SearchResultItem[];
  portal?: SearchResultItem[];
  results?: SearchResultItem[];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  is_active?: boolean;
  mfa_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface MFAEnrollmentResponse {
  secret?: string;
  qr_url?: string;
}

// ---------------------------------------------------------------------------
// Dashboards / detail reads
// ---------------------------------------------------------------------------

export interface DashboardResponse {
  milestones?: Entity[];
  recent_activity?: Entity[];
  [key: string]: unknown;
}

export interface NotificationPreferences {
  email_enabled?: boolean;
  inapp_enabled?: boolean;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  digest_frequency?: string;
  phone?: string;
  segments?: string[];
  [key: string]: unknown;
}

export interface LiveCounterResponse {
  [key: string]: unknown;
}

export interface TickerResponse {
  [key: string]: unknown;
}

export interface HoldingTreeResponse {
  parent?: { name?: string; [key: string]: unknown };
  children?: Entity[];
  [key: string]: unknown;
}

export interface UnreadCountResponse {
  count?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Assessment tools
// ---------------------------------------------------------------------------

export interface AssessmentTemplateResponse {
  template?: Entity;
  questions?: Entity[];
  [key: string]: unknown;
}

export interface AssessmentSessionResponse {
  session_id: string;
  [key: string]: unknown;
}

export interface CandidateChallengeResponse {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Mutation responses whose fields are read inline at the call site.
// ---------------------------------------------------------------------------

export interface DownloadInsightResponse {
  download_url: string;
  [key: string]: unknown;
}

export interface DiagnosticResponse {
  diagnostic_id: string;
  [key: string]: unknown;
}

export interface BookingResponse {
  booking_id: string;
  [key: string]: unknown;
}

export interface CreateAPIKeyResponse {
  key: string;
  [key: string]: unknown;
}

export interface UploadResponse {
  url: string;
  public_id: string;
  bytes: number;
  format: string;
}
