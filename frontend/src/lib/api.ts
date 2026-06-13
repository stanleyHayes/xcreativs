const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

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
    const data = await res.json();
    setTokens(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

async function fetchAPI(path: string, options?: RequestInit, retry = true): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
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
        return fetchAPI(path, options, false);
      } else {
        clearTokens();
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    } else {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newToken) => {
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options?.headers as Record<string, string>),
          };
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
          fetch(`${API_URL}${path}`, { headers: retryHeaders, ...options })
            .then(async (r) => {
              if (!r.ok) {
                const err = await r.json().catch(() => ({ error: "Request failed" }));
                reject(new Error(err.error || `HTTP ${r.status}`));
              } else {
                resolve(r.json());
              }
            })
            .catch(reject);
        });
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Uploads (multipart -> Cloudinary). No Content-Type header so the browser
  // sets the multipart boundary. Returns the hosted file URL.
  uploadFile: async (
    file: File,
    folder?: string
  ): Promise<{ url: string; public_id: string; bytes: number; format: string }> => {
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
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }
    return res.json();
  },

  // Auth
  register: (data: any) => fetchAPI("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => fetchAPI("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    return fetchAPI("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
  },
  refresh: (token: string) => fetchAPI("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: token }) }),
  me: () => fetchAPI("/api/v1/auth/me"),
  enrollMFA: () => fetchAPI("/api/v1/auth/mfa/enroll", { method: "POST" }),
  verifyMFA: (data: any) => fetchAPI("/api/v1/auth/mfa/verify", { method: "POST", body: JSON.stringify(data) }),

  // Portal
  getPortalHome: () => fetchAPI("/api/v1/portal"),
  listEngagements: () => fetchAPI("/api/v1/portal/engagements"),
  getEngagement: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}`),
  getDashboard: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/dashboard`),
  listMilestones: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones`),
  createMilestone: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones`, { method: "POST", body: JSON.stringify(data) }),
  updateMilestone: (id: string, milestoneID: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones/${milestoneID}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMilestone: (id: string, milestoneID: string) => fetchAPI(`/api/v1/portal/engagements/${id}/milestones/${milestoneID}`, { method: "DELETE" }),
  listDeliverables: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables`),
  createDeliverable: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables`, { method: "POST", body: JSON.stringify(data) }),
  updateDeliverable: (id: string, did: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables/${did}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDeliverable: (id: string, did: string) => fetchAPI(`/api/v1/portal/engagements/${id}/deliverables/${did}`, { method: "DELETE" }),
  listDecisions: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions`),
  createDecision: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions`, { method: "POST", body: JSON.stringify(data) }),
  updateDecision: (id: string, did: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions/${did}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDecision: (id: string, did: string) => fetchAPI(`/api/v1/portal/engagements/${id}/decisions/${did}`, { method: "DELETE" }),
  listRisks: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/risks`),
  createRisk: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/risks`, { method: "POST", body: JSON.stringify(data) }),
  updateRisk: (id: string, rid: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/risks/${rid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRisk: (id: string, rid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/risks/${rid}`, { method: "DELETE" }),
  listStakeholders: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders`),
  createStakeholder: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders`, { method: "POST", body: JSON.stringify(data) }),
  updateStakeholder: (id: string, sid: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders/${sid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStakeholder: (id: string, sid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/stakeholders/${sid}`, { method: "DELETE" }),
  getActivityFeed: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/activity`),
  listTeamMembers: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/team`),
  createTeamMember: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/team`, { method: "POST", body: JSON.stringify(data) }),
  removeTeamMember: (id: string, memberID: string) => fetchAPI(`/api/v1/portal/engagements/${id}/team/${memberID}`, { method: "DELETE" }),
  listSupportTickets: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets`),
  createSupportTicket: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets`, { method: "POST", body: JSON.stringify(data) }),
  updateSupportTicket: (id: string, tid: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets/${tid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSupportTicket: (id: string, tid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/tickets/${tid}`, { method: "DELETE" }),
  listBudgetLines: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/budget`),
  listInvoices: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/invoices`),
  generateInvoice: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/invoices`, { method: "POST", body: JSON.stringify(data) }),
  generateInvoicePaymentLink: (invId: string, data: any) => fetchAPI(`/api/v1/invoices/${invId}/payment-link`, { method: "POST", body: JSON.stringify(data) }),
  updateInvoiceStatus: (invId: string, data: any) => fetchAPI(`/api/v1/invoices/${invId}`, { method: "PATCH", body: JSON.stringify(data) }),
  listCapabilityDeliveries: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities`),
  createCapability: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities`, { method: "POST", body: JSON.stringify(data) }),
  updateCapability: (id: string, cid: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities/${cid}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCapability: (id: string, cid: string) => fetchAPI(`/api/v1/portal/engagements/${id}/capabilities/${cid}`, { method: "DELETE" }),
  listDemos: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/demos`),
  createDemoLink: (id: string, data: any) => fetchAPI(`/api/v1/portal/engagements/${id}/demos`, { method: "POST", body: JSON.stringify(data) }),
  revokeDemoLink: (did: string) => fetchAPI(`/api/v1/demos/${did}/revoke`, { method: "POST" }),
  getNotificationPreferences: () => fetchAPI(`/api/v1/notifications/preferences`),
  updateNotificationPreferences: (data: any) => fetchAPI(`/api/v1/notifications/preferences`, { method: "PUT", body: JSON.stringify(data) }),
  broadcastNotification: (data: any) => fetchAPI(`/api/v1/admin/notifications/broadcast`, { method: "POST", body: JSON.stringify(data) }),
  sendDigests: (frequency: string) => fetchAPI(`/api/v1/admin/notifications/send-digests?frequency=${frequency}`, { method: "POST" }),
  listChallenges: () => fetchAPI(`/api/v1/admin/assessment-challenges`),
  createChallenge: (data: any) => fetchAPI(`/api/v1/admin/assessment-challenges`, { method: "POST", body: JSON.stringify(data) }),
  listAssignments: (appId: string) => fetchAPI(`/api/v1/admin/applications/${appId}/assessments`),
  assignChallenge: (appId: string, data: any) => fetchAPI(`/api/v1/admin/applications/${appId}/assessments`, { method: "POST", body: JSON.stringify(data) }),
  reviewAssignment: (aid: string, data: any) => fetchAPI(`/api/v1/admin/assessments/${aid}`, { method: "PATCH", body: JSON.stringify(data) }),
  getCandidateChallenge: (token: string) => fetchAPI(`/api/v1/assessments/challenge/${token}`),
  submitCandidateChallenge: (token: string, data: any) => fetchAPI(`/api/v1/assessments/challenge/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),
  listNotifications: (limit?: number) => fetchAPI(`/api/v1/notifications${limit ? `?limit=${limit}` : ""}`),
  markNotificationRead: (id: string) => fetchAPI(`/api/v1/notifications/${id}/read`, { method: "PUT" }),
  getUnreadNotificationCount: () => fetchAPI("/api/v1/notifications/unread-count"),
  listRFPSubmissionsAdmin: (status?: string) => fetchAPI(`/api/v1/admin/rfps${status ? `?status=${status}` : ""}`),
  listApplicationsAdmin: (status?: string) => fetchAPI(`/api/v1/admin/applications${status ? `?status=${status}` : ""}`),
  updateApplicationStatus: (id: string, data: any) => fetchAPI(`/api/v1/admin/applications/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  listInterviews: (id: string) => fetchAPI(`/api/v1/admin/applications/${id}/interviews`),
  scheduleInterview: (id: string, data: any) => fetchAPI(`/api/v1/admin/applications/${id}/interviews`, { method: "POST", body: JSON.stringify(data) }),
  updateInterview: (iid: string, data: any) => fetchAPI(`/api/v1/admin/interviews/${iid}`, { method: "PATCH", body: JSON.stringify(data) }),
  getRFPSubmissionAdmin: (id: string) => fetchAPI(`/api/v1/admin/rfps/${id}`),
  updateRFPSubmissionAdmin: (id: string, data: any) => fetchAPI(`/api/v1/admin/rfps/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  extractDocument: (text: string) => fetchAPI("/api/v1/document-intelligence/extract", { method: "POST", body: JSON.stringify({ text }) }),
  getLiveCounter: () => fetchAPI("/api/v1/live-counter"),
  getClientTheme: (engagementId: string) => fetchAPI(`/api/v1/portal/theme?engagement_id=${engagementId}`),
  upsertClientTheme: (data: any) => fetchAPI("/api/v1/portal/theme", { method: "POST", body: JSON.stringify(data) }),
  listSignatureRequests: (status?: string) => fetchAPI(`/api/v1/admin/signatures${status ? `?status=${status}` : ""}`),
  createSignatureRequest: (data: any) => fetchAPI("/api/v1/admin/signatures", { method: "POST", body: JSON.stringify(data) }),
  getSignatureRequest: (id: string) => fetchAPI(`/api/v1/admin/signatures/${id}`),
  sendSignatureRequest: (id: string) => fetchAPI(`/api/v1/admin/signatures/${id}/send`, { method: "POST" }),
  updateSignatureStatus: (id: string, data: any) => fetchAPI(`/api/v1/admin/signatures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  listThreads: (engagementID: string, parentType: string, parentID: string) =>
    fetchAPI(`/api/v1/portal/engagements/${engagementID}/threads?parent_type=${parentType}&parent_id=${parentID}`),
  createThread: (data: any) => fetchAPI(`/api/v1/portal/engagements/${data.engagement_id}/threads`, { method: "POST", body: JSON.stringify(data) }),
  listComments: (threadID: string) => fetchAPI(`/api/v1/threads/${threadID}/comments`),
  createComment: (data: any) => fetchAPI(`/api/v1/threads/${data.thread_id}/comments`, { method: "POST", body: JSON.stringify(data) }),
  listDocuments: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/documents`),
  listReports: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/reports`),
  listApprovalWorkflows: (id: string) => fetchAPI(`/api/v1/portal/engagements/${id}/approvals`),
  createApprovalWorkflow: (data: any) => fetchAPI(`/api/v1/portal/engagements/${data.engagement_id}/approvals`, { method: "POST", body: JSON.stringify(data) }),
  updateApprovalWorkflow: (id: string, data: any) => fetchAPI(`/api/v1/approvals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateProfile: (data: any) => fetchAPI("/api/v1/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  myApplications: () => fetchAPI("/api/v1/careers/applications"),

  // Public
  getHome: () => fetchAPI("/api/v1/pages/home"),
  getAbout: () => fetchAPI("/api/v1/pages/about"),
  listServices: () => fetchAPI("/api/v1/services"),
  getService: (slug: string) => fetchAPI(`/api/v1/services/${slug}`),
  listLabs: () => fetchAPI("/api/v1/labs"),
  getLabProduct: (slug: string) => fetchAPI(`/api/v1/labs/${slug}`),
  listWork: (filters?: Record<string, string>) => {
    const qs = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return fetchAPI(`/api/v1/work${qs}`);
  },
  getWork: (slug: string) => fetchAPI(`/api/v1/work/${slug}`),
  listIndustries: () => fetchAPI("/api/v1/industries"),
  getIndustry: (slug: string) => fetchAPI(`/api/v1/industries/${slug}`),
  listInsights: (type?: string) => fetchAPI(`/api/v1/insights${type ? `?type=${type}` : ""}`),
  getInsight: (slug: string) => fetchAPI(`/api/v1/insights/${slug}`),
  downloadInsight: (slug: string, data: { email: string; first_name?: string }) =>
    fetchAPI(`/api/v1/insights/${slug}/download`, { method: "POST", body: JSON.stringify(data) }),
  listGlossary: () => fetchAPI("/api/v1/glossary"),
  listFAQ: () => fetchAPI("/api/v1/faq"),
  listPress: () => fetchAPI("/api/v1/press"),
  getTicker: () => fetchAPI("/api/v1/metrics/ticker"),
  search: (q: string) => fetchAPI(`/api/v1/search?q=${encodeURIComponent(q)}`),
  getHoldingTree: () => fetchAPI("/api/v1/visualizations/holding-tree"),
  listSubsidiaries: () => fetchAPI("/api/v1/subsidiaries"),
  listRoles: () => fetchAPI("/api/v1/careers/roles"),
  getRole: (slug: string) => fetchAPI(`/api/v1/careers/roles/${slug}`),
  applyRole: (slug: string, data: any) => fetchAPI(`/api/v1/careers/roles/${slug}/apply`, { method: "POST", body: JSON.stringify(data) }),
  joinTalentNetwork: (data: any) => fetchAPI("/api/v1/careers/talent-network", { method: "POST", body: JSON.stringify(data) }),
  startDiagnostic: (data: any) => fetchAPI("/api/v1/diagnostics/start", { method: "POST", body: JSON.stringify(data) }),
  createEstimate: (data: any) => fetchAPI("/api/v1/estimates", { method: "POST", body: JSON.stringify(data) }),
  subscribeNewsletter: (data: any) => fetchAPI("/api/v1/newsletter/subscribe", { method: "POST", body: JSON.stringify(data) }),
  createBooking: (data: any) => fetchAPI("/api/v1/bookings", { method: "POST", body: JSON.stringify(data) }),
  listBookings: (status?: string) => fetchAPI(`/api/v1/admin/bookings${status ? `?status=${status}` : ""}`),
  updateBooking: (id: string, data: any) => fetchAPI(`/api/v1/admin/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getAssessmentTemplate: (slug: string) => fetchAPI(`/api/v1/assessments/${slug}`),
  createAssessmentSession: (data: any) => fetchAPI("/api/v1/assessments/sessions", { method: "POST", body: JSON.stringify(data) }),
  submitAssessmentAnswers: (id: string, data: any) => fetchAPI(`/api/v1/assessments/sessions/${id}/submit`, { method: "POST", body: JSON.stringify(data) }),
  getPartnerDashboard: () => fetchAPI("/api/v1/partner/dashboard"),
  getPartnerProducts: () => fetchAPI("/api/v1/partner/products"),
  getPartnerAgreements: () => fetchAPI("/api/v1/partner/agreements"),
  getPartnerReferrals: () => fetchAPI("/api/v1/partner/referrals"),
  createPartnerReferral: (data: any) => fetchAPI("/api/v1/partner/referrals", { method: "POST", body: JSON.stringify(data) }),
  getPartnerOrders: () => fetchAPI("/api/v1/partner/orders"),
  applyPartnership: (data: any) => fetchAPI("/api/v1/partners/apply", { method: "POST", body: JSON.stringify(data) }),
  listAPIKeys: () => fetchAPI("/api/v1/api-keys"),
  createAPIKey: (data: any) => fetchAPI("/api/v1/api-keys", { method: "POST", body: JSON.stringify(data) }),
  revokeAPIKey: (id: string) => fetchAPI(`/api/v1/api-keys/${id}/revoke`, { method: "POST" }),
  listPartnerApplications: (status?: string) => fetchAPI(`/api/v1/admin/partner/applications${status ? `?status=${status}` : ""}`),
  updatePartnerApplication: (id: string, data: any) => fetchAPI(`/api/v1/admin/partner/applications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getAdminAnalytics: () => fetchAPI("/api/v1/admin/analytics"),
  // Layer 06 Content
  listReadingList: (category?: string) => fetchAPI(`/api/v1/reading-list${category ? `?category=${category}` : ""}`),
  getReadingListItem: (slug: string) => fetchAPI(`/api/v1/reading-list/${slug}`),
  listAudioBriefs: () => fetchAPI("/api/v1/audio-briefs"),
  getAudioBrief: (slug: string) => fetchAPI(`/api/v1/audio-briefs/${slug}`),
  listWebinars: (status?: string) => fetchAPI(`/api/v1/webinars${status ? `?status=${status}` : ""}`),
  getWebinar: (slug: string) => fetchAPI(`/api/v1/webinars/${slug}`),
  registerForWebinar: (slug: string, data: any) => fetchAPI(`/api/v1/webinars/${slug}/register`, { method: "POST", body: JSON.stringify(data) }),
  listMediaKit: () => fetchAPI("/api/v1/media-kit"),

  // Admin Webhooks
  listWebhooks: () => fetchAPI("/api/v1/admin/webhooks"),
  createWebhook: (data: any) => fetchAPI("/api/v1/admin/webhooks", { method: "POST", body: JSON.stringify(data) }),
  deleteWebhook: (id: string) => fetchAPI(`/api/v1/admin/webhooks/${id}`, { method: "DELETE" }),
  listWebhookDeliveries: () => fetchAPI("/api/v1/admin/webhooks/deliveries"),

  // Admin Engagements
  listAllEngagements: () => fetchAPI("/api/v1/admin/engagements"),
  createEngagement: (data: any) => fetchAPI("/api/v1/admin/engagements", { method: "POST", body: JSON.stringify(data) }),

  // Admin Content Management
  listPages: (status?: string) => fetchAPI(`/api/v1/admin/pages${status ? `?status=${status}` : ""}`),
  getPageAdmin: (slug: string) => fetchAPI(`/api/v1/admin/pages/${slug}`),
  createPage: (data: any) => fetchAPI("/api/v1/admin/pages", { method: "POST", body: JSON.stringify(data) }),
  updatePage: (id: string, data: any) => fetchAPI(`/api/v1/admin/pages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePage: (id: string) => fetchAPI(`/api/v1/admin/pages/${id}`, { method: "DELETE" }),
};
