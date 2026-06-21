import type {
  AgreementsResponse,
  APIKeysResponse,
  ApplicationsResponse,
  ApprovalWorkflowsResponse,
  AuditLogsResponse,
  AdminUsersResponse,
  AdminRolesResponse,
  AdminPermissionsResponse,
  AssessmentSessionResponse,
  AudioBriefsResponse,
  AssessmentTemplateResponse,
  AssignmentsResponse,
  BookingResponse,
  BudgetLinesResponse,
  CandidateChallengeResponse,
  CareerRolesResponse,
  CapabilityDeliveriesResponse,
  ChallengesResponse,
  CommentsResponse,
  CreateAPIKeyResponse,
  DashboardResponse,
  DecisionsResponse,
  DemosResponse,
  DiagnosticResponse,
  DocumentsResponse,
  DownloadInsightResponse,
  EngagementsResponse,
  Entity,
  FAQResponse,
  GlossaryResponse,
  HoldingTreeResponse,
  InterviewsResponse,
  InvoicesResponse,
  LiveCounterResponse,
  LoginResponse,
  MediaKitResponse,
  MFAEnrollmentResponse,
  MyApplicationsResponse,
  NotificationPreferences,
  NotificationsResponse,
  OrdersResponse,
  PartnerApplicationsResponse,
  PressResponse,
  ProductsResponse,
  ReadingListResponse,
  ReferralsResponse,
  ReportsResponse,
  SubsidiariesResponse,
  SearchResponse,
  TeamMembersResponse,
  ThreadsResponse,
  TickerResponse,
  UnreadCountResponse,
  UploadResponse,
  WebhookDeliveriesResponse,
  WebhooksResponse,
  WebinarsResponse,
} from "./types";

// In the browser, use a RELATIVE base ("") so requests hit the app's own origin
// and flow through the Next.js rewrite proxy (`/api/* -> backend`). That keeps
// API calls same-origin — no CORS — in dev and on Vercel (the rewrite proxies
// to the Render backend). On the server (SSR/RSC) there is no origin, so fall
// back to the absolute backend URL.
const API_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"
    : "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return null;
    setTokens(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

interface APIError {
  error?: string;
}

async function fetchAPI<T = unknown>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await doRefresh();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
        return fetchAPI<T>(path, options, false);
      } else {
        clearTokens();
        // Origin-aware: login lives on the portal app. On the portal,
        // NEXT_PUBLIC_PORTAL_URL is unset → relative "/login" (same origin).
        // On marketing it points at the portal so a 401 lands on portal login.
        // Preserve a non-default locale segment (e.g. /fr) so a French user isn't
        // dropped onto the English /login. Default locale (en) is unprefixed.
        const localeMatch =
          typeof window !== "undefined" ? window.location.pathname.match(/^\/(fr)(?:\/|$)/) : null;
        const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
        window.location.href = `${process.env.NEXT_PUBLIC_PORTAL_URL || ""}${localePrefix}/login`;
        throw new Error("Session expired");
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        subscribeToRefresh((newToken) => {
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options?.headers as Record<string, string> | undefined),
          };
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
          fetch(`${API_URL}${path}`, { headers: retryHeaders, ...options })
            .then(async (r) => {
              if (!r.ok) {
                const err: APIError = await r.json().catch(() => ({ error: "Request failed" }));
                reject(new Error(err.error || `HTTP ${r.status}`));
              } else {
                resolve((await r.json()) as T);
              }
            })
            .catch(reject);
        });
      });
    }
  }

  if (!res.ok) {
    const err: APIError = await res.json().catch(() => ({ error: "Request failed" }));
    // Authenticated but MFA isn't enrolled yet — the backend returns 403
    // "mfa_required" on protected endpoints. Route the user to enrollment
    // instead of surfacing a generic failure. (The /portal/mfa page calls only
    // MFA-exempt endpoints, so it loads fine; the endsWith guard avoids a loop.)
    if (
      res.status === 403 &&
      err.error === "mfa_required" &&
      typeof window !== "undefined" &&
      !window.location.pathname.endsWith("/portal/mfa")
    ) {
      const localeMatch = window.location.pathname.match(/^\/(fr)(?:\/|$)/);
      const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
      window.location.href = `${localePrefix}/portal/mfa`;
    }
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  // Uploads (multipart -> Cloudinary). No Content-Type header so the browser
  // sets the multipart boundary. Returns the hosted file URL.
  uploadFile: async (file: File, folder?: string): Promise<UploadResponse> => {
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);
    const token = getToken();
    const res = await fetch(`${API_URL}/api/v1/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const err: APIError = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }
    return (await res.json()) as UploadResponse;
  },

  // Auth — pass retry=false so a 401 (e.g. "invalid credentials") surfaces the
  // real backend error instead of triggering the token-refresh/redirect path
  // (which would mislabel a bad password as "Session expired").
  register: (data: Record<string, unknown>) => fetchAPI("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }, false),
  login: (data: Record<string, unknown>) => fetchAPI<LoginResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }, false),
  logout: () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    return fetchAPI("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
  },
  refresh: (token: string) => fetchAPI("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: token }) }),
  me: () => fetchAPI<Entity>("/api/v1/auth/me"),
  enrollMFA: () => fetchAPI<MFAEnrollmentResponse>("/api/v1/auth/mfa/enroll", { method: "POST" }),
  verifyMFA: (data: Record<string, unknown>) => fetchAPI("/api/v1/auth/mfa/verify", { method: "POST", body: JSON.stringify(data) }),

  // Portal
  getPortalHome: () => fetchAPI<Entity>("/api/v1/portal"),
  listEngagements: () => fetchAPI<EngagementsResponse>("/api/v1/portal/engagements"),
  getEngagement: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}`),
  getDashboard: (id: string) => fetchAPI<DashboardResponse>(`/api/v1/portal/engagements/${id}/dashboard`),
  listMilestones: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/milestones`),
  createMilestone: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones`, { method: "POST", body: JSON.stringify(data) }),
  updateMilestone: (id: string, milestoneID: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones/${milestoneID}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMilestone: (id: string, milestoneID: string) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones/${milestoneID}`, { method: "DELETE" }),
  listDeliverables: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/deliverables`),
  createDeliverable: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables`, { method: "POST", body: JSON.stringify(data) }),
  updateDeliverable: (id: string, did: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables/${did}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDeliverable: (id: string, did: string) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables/${did}`, { method: "DELETE" }),
  listDecisions: (id: string) => fetchAPI<DecisionsResponse>(`/api/v1/portal/engagements/${id}/decisions`),
  createDecision: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions`, { method: "POST", body: JSON.stringify(data) }),
  updateDecision: (id: string, did: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions/${did}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDecision: (id: string, did: string) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions/${did}`, { method: "DELETE" }),
  listRisks: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/risks`),
  createRisk: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/risks`, { method: "POST", body: JSON.stringify(data) }),
  updateRisk: (id: string, rid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/risks/${rid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRisk: (id: string, rid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/risks/${rid}`, { method: "DELETE" }),
  listStakeholders: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/stakeholders`),
  createStakeholder: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders`, { method: "POST", body: JSON.stringify(data) }),
  updateStakeholder: (id: string, sid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders/${sid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStakeholder: (id: string, sid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders/${sid}`, { method: "DELETE" }),
  getActivityFeed: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/activity`),
  listTeamMembers: (id: string) => fetchAPI<TeamMembersResponse>(`/api/v1/portal/engagements/${id}/team`),
  createTeamMember: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/team`, { method: "POST", body: JSON.stringify(data) }),
  removeTeamMember: (id: string, memberID: string) => fetchAPI(`/api/v1/portal/engagements/${id}/team/${memberID}`, { method: "DELETE" }),
  listSupportTickets: (id: string) => fetchAPI<Entity>(`/api/v1/portal/engagements/${id}/tickets`),
  createSupportTicket: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets`, { method: "POST", body: JSON.stringify(data) }),
  updateSupportTicket: (id: string, tid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets/${tid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSupportTicket: (id: string, tid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets/${tid}`, { method: "DELETE" }),
  listBudgetLines: (id: string) => fetchAPI<BudgetLinesResponse>(`/api/v1/portal/engagements/${id}/budget`),
  listInvoices: (id: string) => fetchAPI<InvoicesResponse>(`/api/v1/portal/engagements/${id}/invoices`),
  generateInvoice: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/invoices`, { method: "POST", body: JSON.stringify(data) }),
  generateInvoicePaymentLink: (invId: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/invoices/${invId}/payment-link`, { method: "POST", body: JSON.stringify(data) }),
  updateInvoiceStatus: (invId: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/invoices/${invId}`, { method: "PATCH", body: JSON.stringify(data) }),
  listCapabilityDeliveries: (id: string) => fetchAPI<CapabilityDeliveriesResponse>(`/api/v1/portal/engagements/${id}/capabilities`),
  createCapability: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities`, { method: "POST", body: JSON.stringify(data) }),
  updateCapability: (id: string, cid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities/${cid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCapability: (id: string, cid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities/${cid}`, { method: "DELETE" }),
  listDemos: (id: string) => fetchAPI<DemosResponse>(`/api/v1/portal/engagements/${id}/demos`),
  createDemoLink: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${id}/demos`, { method: "POST", body: JSON.stringify(data) }),
  revokeDemoLink: (did: string) => fetchAPI(`/api/v1/demos/${did}/revoke`, { method: "POST" }),
  getNotificationPreferences: () => fetchAPI<NotificationPreferences>(`/api/v1/notifications/preferences`),
  updateNotificationPreferences: (data: Record<string, unknown>) => fetchAPI(`/api/v1/notifications/preferences`, { method: "PUT", body: JSON.stringify(data) }),
  broadcastNotification: (data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/notifications/broadcast`, { method: "POST", body: JSON.stringify(data) }),
  sendDigests: (frequency: string) => fetchAPI(`/api/v1/admin/notifications/send-digests?frequency=${frequency}`, { method: "POST" }),
  listChallenges: () => fetchAPI<ChallengesResponse>(`/api/v1/admin/assessment-challenges`),
  createChallenge: (data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/assessment-challenges`, { method: "POST", body: JSON.stringify(data) }),
  listAssignments: (appId: string) => fetchAPI<AssignmentsResponse>(`/api/v1/admin/applications/${appId}/assessments`),
  assignChallenge: (appId: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/applications/${appId}/assessments`, { method: "POST", body: JSON.stringify(data) }),
  reviewAssignment: (aid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/assessments/${aid}`, { method: "PATCH", body: JSON.stringify(data) }),
  getCandidateChallenge: (token: string) => fetchAPI<CandidateChallengeResponse>(`/api/v1/assessments/challenge/${token}`),
  submitCandidateChallenge: (token: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/assessments/challenge/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),
  listNotifications: (limit?: number) => fetchAPI<NotificationsResponse>(`/api/v1/notifications${limit ? `?limit=${limit}` : ""}`),
  markNotificationRead: (id: string) => fetchAPI(`/api/v1/notifications/${id}/read`, { method: "PUT" }),
  getUnreadNotificationCount: () => fetchAPI<UnreadCountResponse>("/api/v1/notifications/unread-count"),
  listRFPSubmissionsAdmin: (status?: string) => fetchAPI<Entity>(`/api/v1/admin/rfps${status ? `?status=${status}` : ""}`),
  listApplicationsAdmin: (status?: string) => fetchAPI<ApplicationsResponse>(`/api/v1/admin/applications${status ? `?status=${status}` : ""}`),
  updateApplicationStatus: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/applications/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  listInterviews: (id: string) => fetchAPI<InterviewsResponse>(`/api/v1/admin/applications/${id}/interviews`),
  scheduleInterview: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/applications/${id}/interviews`, { method: "POST", body: JSON.stringify(data) }),
  updateInterview: (iid: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/interviews/${iid}`, { method: "PATCH", body: JSON.stringify(data) }),
  listCareerRolesAdmin: () => fetchAPI<CareerRolesResponse>("/api/v1/admin/careers/roles"),
  createCareerRoleAdmin: (data: Record<string, unknown>) => fetchAPI<Entity>("/api/v1/admin/careers/roles", { method: "POST", body: JSON.stringify(data) }),
  updateCareerRoleAdmin: (id: string, data: Record<string, unknown>) => fetchAPI<Entity>(`/api/v1/admin/careers/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  listAuditLogsAdmin: (filters?: Record<string, string>) => {
    const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return fetchAPI<AuditLogsResponse>(`/api/v1/admin/audit-logs${qs}`);
  },
  listUsersAdmin: (filters?: Record<string, string>) => {
    const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return fetchAPI<AdminUsersResponse>(`/api/v1/admin/users${qs}`);
  },
  updateUserAdmin: (id: string, data: { role?: string; is_active?: boolean }) =>
    fetchAPI(`/api/v1/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  listRolesAdmin: () => fetchAPI<AdminRolesResponse>("/api/v1/admin/roles"),
  setRolePermissionsAdmin: (role: string, permissionIds: string[]) =>
    fetchAPI(`/api/v1/admin/roles/${role}/permissions`, { method: "PUT", body: JSON.stringify({ permission_ids: permissionIds }) }),
  listPermissionsAdmin: () => fetchAPI<AdminPermissionsResponse>("/api/v1/admin/permissions"),
  getRFPSubmissionAdmin: (id: string) => fetchAPI<Entity>(`/api/v1/admin/rfps/${id}`),
  updateRFPSubmissionAdmin: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/rfps/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  extractDocument: (text: string) => fetchAPI("/api/v1/document-intelligence/extract", { method: "POST", body: JSON.stringify({ text }) }),
  getLiveCounter: () => fetchAPI<LiveCounterResponse>("/api/v1/live-counter"),
  getClientTheme: (engagementId: string) => fetchAPI<Entity>(`/api/v1/portal/theme?engagement_id=${engagementId}`),
  upsertClientTheme: (data: Record<string, unknown>) => fetchAPI("/api/v1/portal/theme", { method: "POST", body: JSON.stringify(data) }),
  listSignatureRequests: (status?: string) => fetchAPI<Entity>(`/api/v1/admin/signatures${status ? `?status=${status}` : ""}`),
  createSignatureRequest: (data: Record<string, unknown>) => fetchAPI("/api/v1/admin/signatures", { method: "POST", body: JSON.stringify(data) }),
  getSignatureRequest: (id: string) => fetchAPI<Entity>(`/api/v1/admin/signatures/${id}`),
  sendSignatureRequest: (id: string) => fetchAPI(`/api/v1/admin/signatures/${id}/send`, { method: "POST" }),
  updateSignatureStatus: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/signatures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  listThreads: (engagementID: string, parentType: string, parentID: string) =>
    fetchAPI<ThreadsResponse>(`/api/v1/portal/engagements/${engagementID}/threads?parent_type=${parentType}&parent_id=${parentID}`),
  createThread: (data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${String(data.engagement_id)}/threads`, { method: "POST", body: JSON.stringify(data) }),
  listComments: (threadID: string) => fetchAPI<CommentsResponse>(`/api/v1/threads/${threadID}/comments`),
  createComment: (data: Record<string, unknown>) => fetchAPI(`/api/v1/threads/${String(data.thread_id)}/comments`, { method: "POST", body: JSON.stringify(data) }),
  listDocuments: (id: string) => fetchAPI<DocumentsResponse>(`/api/v1/portal/engagements/${id}/documents`),
  listReports: (id: string) => fetchAPI<ReportsResponse>(`/api/v1/portal/engagements/${id}/reports`),
  listApprovalWorkflows: (id: string) => fetchAPI<ApprovalWorkflowsResponse>(`/api/v1/portal/engagements/${id}/approvals`),
  createApprovalWorkflow: (data: Record<string, unknown>) => fetchAPI(`/api/v1/portal/engagements/${String(data.engagement_id)}/approvals`, { method: "POST", body: JSON.stringify(data) }),
  updateApprovalWorkflow: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/approvals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateProfile: (data: Record<string, unknown>) => fetchAPI<Entity>("/api/v1/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  myApplications: () => fetchAPI<MyApplicationsResponse>("/api/v1/careers/applications"),

  // Public
  getHome: () => fetchAPI<Entity>("/api/v1/pages/home"),
  getAbout: () => fetchAPI<Entity>("/api/v1/pages/about"),
  listServices: () => fetchAPI<Entity>("/api/v1/services"),
  getService: (slug: string) => fetchAPI<Entity>(`/api/v1/services/${slug}`),
  listLabs: () => fetchAPI<Entity>("/api/v1/labs"),
  getLabProduct: (slug: string) => fetchAPI<Entity>(`/api/v1/labs/${slug}`),
  listWork: (filters?: Record<string, string>) => {
    const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return fetchAPI<Entity>(`/api/v1/work${qs}`);
  },
  getWork: (slug: string) => fetchAPI<Entity>(`/api/v1/work/${slug}`),
  listIndustries: () => fetchAPI<Entity>("/api/v1/industries"),
  getIndustry: (slug: string) => fetchAPI<Entity>(`/api/v1/industries/${slug}`),
  listInsights: (type?: string) => fetchAPI<Entity>(`/api/v1/insights${type ? `?type=${type}` : ""}`),
  getInsight: (slug: string) => fetchAPI<Entity>(`/api/v1/insights/${slug}`),
  downloadInsight: (slug: string, data: { email: string; first_name?: string }) =>
    fetchAPI<DownloadInsightResponse>(`/api/v1/insights/${slug}/download`, { method: "POST", body: JSON.stringify(data) }),
  listGlossary: () => fetchAPI<GlossaryResponse>("/api/v1/glossary"),
  listFAQ: () => fetchAPI<FAQResponse>("/api/v1/faq"),
  listPress: () => fetchAPI<PressResponse>("/api/v1/press"),
  getTicker: () => fetchAPI<TickerResponse>("/api/v1/metrics/ticker"),
  search: (q: string) => fetchAPI<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(q)}`),
  getHoldingTree: () => fetchAPI<HoldingTreeResponse>("/api/v1/visualizations/holding-tree"),
  listSubsidiaries: () => fetchAPI<SubsidiariesResponse>("/api/v1/subsidiaries"),
  listRoles: () => fetchAPI<Entity>("/api/v1/careers/roles"),
  getRole: (slug: string) => fetchAPI<Entity>(`/api/v1/careers/roles/${slug}`),
  applyRole: (slug: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/careers/roles/${slug}/apply`, { method: "POST", body: JSON.stringify(data) }),
  joinTalentNetwork: (data: Record<string, unknown>) => fetchAPI("/api/v1/careers/talent-network", { method: "POST", body: JSON.stringify(data) }),
  startDiagnostic: (data: Record<string, unknown>) => fetchAPI<DiagnosticResponse>("/api/v1/diagnostics/start", { method: "POST", body: JSON.stringify(data) }),
  createEstimate: (data: Record<string, unknown>) => fetchAPI("/api/v1/estimates", { method: "POST", body: JSON.stringify(data) }),
  subscribeNewsletter: (data: Record<string, unknown>) => fetchAPI("/api/v1/newsletter/subscribe", { method: "POST", body: JSON.stringify(data) }),
  createBooking: (data: Record<string, unknown>) => fetchAPI<BookingResponse>("/api/v1/bookings", { method: "POST", body: JSON.stringify(data) }),
  listBookings: (status?: string) => fetchAPI<Entity>(`/api/v1/admin/bookings${status ? `?status=${status}` : ""}`),
  updateBooking: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getAssessmentTemplate: (slug: string) => fetchAPI<AssessmentTemplateResponse>(`/api/v1/assessments/${slug}`),
  createAssessmentSession: (data: Record<string, unknown>) => fetchAPI<AssessmentSessionResponse>("/api/v1/assessments/sessions", { method: "POST", body: JSON.stringify(data) }),
  submitAssessmentAnswers: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/assessments/sessions/${id}/submit`, { method: "POST", body: JSON.stringify(data) }),
  getPartnerDashboard: () => fetchAPI<Entity>("/api/v1/partner/dashboard"),
  getPartnerProducts: () => fetchAPI<ProductsResponse>("/api/v1/partner/products"),
  getPartnerAgreements: () => fetchAPI<AgreementsResponse>("/api/v1/partner/agreements"),
  getPartnerReferrals: () => fetchAPI<ReferralsResponse>("/api/v1/partner/referrals"),
  createPartnerReferral: (data: Record<string, unknown>) => fetchAPI("/api/v1/partner/referrals", { method: "POST", body: JSON.stringify(data) }),
  getPartnerOrders: () => fetchAPI<OrdersResponse>("/api/v1/partner/orders"),
  applyPartnership: (data: Record<string, unknown>) => fetchAPI("/api/v1/partners/apply", { method: "POST", body: JSON.stringify(data) }),
  listAPIKeys: () => fetchAPI<APIKeysResponse>("/api/v1/api-keys"),
  createAPIKey: (data: Record<string, unknown>) => fetchAPI<CreateAPIKeyResponse>("/api/v1/api-keys", { method: "POST", body: JSON.stringify(data) }),
  revokeAPIKey: (id: string) => fetchAPI(`/api/v1/api-keys/${id}/revoke`, { method: "POST" }),
  listPartnerApplications: (status?: string) => fetchAPI<PartnerApplicationsResponse>(`/api/v1/admin/partner/applications${status ? `?status=${status}` : ""}`),
  updatePartnerApplication: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/partner/applications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getAdminAnalytics: () => fetchAPI<Entity>("/api/v1/admin/analytics"),
  // Layer 06 Content
  listReadingList: (category?: string) => fetchAPI<ReadingListResponse>(`/api/v1/reading-list${category ? `?category=${category}` : ""}`),
  getReadingListItem: (slug: string) => fetchAPI<Entity>(`/api/v1/reading-list/${slug}`),
  listAudioBriefs: () => fetchAPI<AudioBriefsResponse>("/api/v1/audio-briefs"),
  getAudioBrief: (slug: string) => fetchAPI<Entity>(`/api/v1/audio-briefs/${slug}`),
  listWebinars: (status?: string) => fetchAPI<WebinarsResponse>(`/api/v1/webinars${status ? `?status=${status}` : ""}`),
  getWebinar: (slug: string) => fetchAPI<Entity>(`/api/v1/webinars/${slug}`),
  registerForWebinar: (slug: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/webinars/${slug}/register`, { method: "POST", body: JSON.stringify(data) }),
  listMediaKit: () => fetchAPI<MediaKitResponse>("/api/v1/media-kit"),

  // Admin Webhooks
  listWebhooks: () => fetchAPI<WebhooksResponse>("/api/v1/admin/webhooks"),
  createWebhook: (data: Record<string, unknown>) => fetchAPI("/api/v1/admin/webhooks", { method: "POST", body: JSON.stringify(data) }),
  deleteWebhook: (id: string) => fetchAPI(`/api/v1/admin/webhooks/${id}`, { method: "DELETE" }),
  listWebhookDeliveries: () => fetchAPI<WebhookDeliveriesResponse>("/api/v1/admin/webhooks/deliveries"),

  // Admin Engagements
  listAllEngagements: () => fetchAPI<EngagementsResponse>("/api/v1/admin/engagements"),
  createEngagement: (data: Record<string, unknown>) => fetchAPI("/api/v1/admin/engagements", { method: "POST", body: JSON.stringify(data) }),

  // Admin Content Management
  listPages: (status?: string) => fetchAPI<Entity>(`/api/v1/admin/pages${status ? `?status=${status}` : ""}`),
  getPageAdmin: (slug: string) => fetchAPI<Entity>(`/api/v1/admin/pages/${slug}`),
  createPage: (data: Record<string, unknown>) => fetchAPI("/api/v1/admin/pages", { method: "POST", body: JSON.stringify(data) }),
  updatePage: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v1/admin/pages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePage: (id: string) => fetchAPI(`/api/v1/admin/pages/${id}`, { method: "DELETE" }),
};
