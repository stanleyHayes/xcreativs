# XCreativs Web Platform — Agent Build Plan

> Derived from `XCreativs_Web_Platform_Specification.pdf` v1.0 (15 May 2026).  
> Backend: Go (raw PostgreSQL, no ORM). Frontend: Next.js 14+ (App Router, TypeScript).  
> Architecture: Clean Architecture / Ports & Adapters (Hexagonal) with Domain-Driven Design boundaries.

---

## 0. Architectural Principles

1. **Clean Architecture (Hexagonal)** — Domain at the center. Use cases surround it. Infrastructure (DB, HTTP, external APIs) is repluggable.
2. **No ORM** — Raw SQL via `pgx` (PostgreSQL driver). Migrations via `golang-migrate`. Queries live in repository adapters.
3. **Database-per-service boundary (within monolith)** — Separate schemas per bounded context to allow future extraction.
4. **Event-driven internally** — Domain events decouple layers (e.g., `LeadQualified`, `EngagementCreated`).
5. **API-first** — REST JSON for browser, gRPC-ready internal structures for future microservice extraction.
6. **Security by default** — MFA, RBAC, audit logging, parameterized queries, CSP headers, rate limiting.
7. **Performance for Ghana/West Africa** — Edge caching, aggressive DB indexing, connection pooling, PWA offline support.
8. **Bilingual EN/FR from day one** — All user-facing strings externalized; CMS-managed content stores both languages.

---

## 1. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | Go 1.22+ | Production seriousness, hiring availability in Ghana, operational simplicity |
| **DB Driver** | `pgx` (pgxpool) | Production-grade PostgreSQL driver with connection pooling |
| **Migrations** | `golang-migrate` | Versioned, reversible SQL migrations |
| **Router** | `chi` (go-chi/chi) | Lightweight, idiomatic, middleware-rich |
| **Auth** | Custom JWT + `bcrypt` + TOTP (MFA) | Full control; SSO (Google/Microsoft) via OAuth2; SAML later |
| **Validation** | `go-playground/validator` | Struct tags + custom validators |
| **Email** | `resend` Go SDK | Transactional + newsletter |
| **Payments** | `stripe-go` + Paystack Go lib | International + local |
| **Search (public)** | Postgres full-text + `pg_trgm` | Self-hosted, sovereign; Algolia/Typesense optional later |
| **Search (portal)** | Postgres full-text per workspace | Scoped, fast, no external dependency |
| **Cache / Sessions** | Redis (`go-redis`) | Rate limiting, sessions, short-lived caches |
| **Observability** | `slog` structured logs + OpenTelemetry | Sentry for errors; Axiom/BetterStack for logs |
| **Frontend** | Next.js 14+ App Router, TypeScript | Spec requirement; SSR for public, SPA feel for portal |
| **Styling** | Tailwind CSS | Strict 3-token design system (#0066CC, #FFFFFF, #000000) |
| **Motion** | Motion (Framer Motion) | Orchestrated scroll-driven transitions |
| **Forms** | React Hook Form + Zod | Client + server validation |
| **i18n** | `next-intl` | EN/FR bilingual |
| **File Storage** | S3-compatible (Cloudflare R2) | Signed URLs, versioned, role-scoped |
| **PWA** | `next-pwa` | Offline-first portal; service worker for key views |
| **Hosting (rec.)** | Hetzner/DigitalOcean (Ghana+EU) or Vercel frontend + self-hosted Go | Sovereignty-conscious option preferred |

---

## 2. Bounded Contexts & Schema Design

Each context gets its own PostgreSQL schema. This enables future extraction into standalone services.

```
public          -- migrations table, shared enums
content         -- pages, articles, case_dossiers, glossary, press, industries, services
lead_qual       -- diagnostics, scope_estimates, rfp_submissions, newsletter_subs
engagement      -- engagements, deliverables, decisions, risks, milestones, budgets, invoices, approvals
comms           -- threads, comments, notifications, activity_feed
identity        -- users, roles, permissions, sessions, mfa, audit_log
partner         -- partner_apps, partner_dashboards, referral_tracking, distribution
 talent          -- roles, applications, talent_network, assessments, internships
portal_config   -- workspace_settings, white_label, api_keys
interactive     -- readiness_assessments, demo_usage, lattice_explorer
```

---

## 3. Phase A — Foundation (Weeks 1–10)

> Goal: Public surface + intake system + core cross-cutting features. Shippable standalone.

### 3.1 Infrastructure & Tooling (Week 1)
- [ ] Repo layout (`backend/`, `frontend/`, `infra/`, `docs/`)
- [ ] Go module init; dependency selection; `Makefile` targets (`run`, `test`, `migrate`, `seed`)
- [ ] Docker Compose (Postgres 16, Redis, backend, frontend)
- [ ] Migration framework wired; `migrate` CLI installed
- [ ] Base HTTP server with `chi`: structured logging (`slog`), request ID, recover, CORS, rate limiter
- [ ] Configuration loader (`env` + `.env` local); secrets via env vars only
- [ ] Health check endpoint (`/healthz`)
- [ ] CI skeleton (GitHub Actions: lint, test, build)

### 3.2 Database Foundation (Week 1–2)
- [ ] Migration 001: `public` enums (status types, role types, currency codes, sectors)
- [ ] Migration 002: `content` schema — pages, services, labs_products, case_dossiers, industries, insights, glossary, press_releases, faqs
- [ ] Migration 003: `identity` schema — users, roles, permissions, sessions, mfa_secrets, audit_log
- [ ] Migration 004: `lead_qual` schema — diagnostics, diagnostic_questions, scope_estimates, rfp_submissions, newsletter_subscribers, newsletter_segments
- [ ] Migration 005: `talent` schema — job_roles, applications, talent_network_subs, internship_programs
- [ ] Migration 006: indexes for performance (FTS, trigram, foreign keys)
- [ ] Seed data: 5 service lines, 1 Labs product (ILIVVON), 15+ case dossiers, 8 industries, sample insights, glossary terms, FAQ categories
- [ ] Repository interfaces (ports) defined in `domain/`; implementations in `internal/adapters/db/`

### 3.3 Cross-Cutting Platform Layer (Week 2–3)
- [ ] **Audit log**: middleware captures every request → `identity.audit_log` (user, IP, action, resource, timestamp)
- [ ] **Auth foundation**: registration, login, logout, JWT access + refresh tokens, bcrypt passwords
- [ ] **MFA foundation**: TOTP enrollment (QR code), verification, mandatory enforcement flag
- [ ] **RBAC foundation**: roles (`admin`, `editor`, `viewer`) and permissions table; middleware enforces
- [ ] **Notifications foundation**: in-app notification table + email dispatcher interface; Resend adapter
- [ ] **File storage adapter**: S3-compatible interface; upload + signed-URL retrieval
- [ ] **i18n middleware**: `Accept-Language` detection; EN/FR fallback
- [ ] **Search foundation**: Postgres FTS helper; public search across `content` tables

### 3.4 Layer 01 — Public Surface APIs (Week 3–5)
- [ ] `GET /api/v1/pages/home` — hero data, live engagement ticker, services snapshot, Labs preview, selected dossiers
- [ ] `GET /api/v1/pages/about` — mission, principles, founder bios, leadership, advisory, timeline, reading list
- [ ] `GET /api/v1/services` — list 5 service lines
- [ ] `GET /api/v1/services/:slug` — deep page per service (methodology, deliverables, timeline, price band, FAQ, CTA)
- [ ] `GET /api/v1/labs` — Labs overview, operating loop, product list
- [ ] `GET /api/v1/labs/:slug` — product page (ILIVVON first-class)
- [ ] `GET /api/v1/subsidiaries` — holding-company map data
- [ ] `GET /api/v1/work` — case dossier index (filterable by sector, service, scale, stage)
- [ ] `GET /api/v1/work/:slug` — dossier detail (brief, constraints, architecture, what shipped, IP retained, learnings)
- [ ] `GET /api/v1/industries` — sector list
- [ ] `GET /api/v1/industries/:slug` — sector page with mapped capabilities + relevant dossiers + intake CTA
- [ ] `GET /api/v1/insights` — content library index (field notes, theses, whitepapers); taggable, searchable, RSS-ready
- [ ] `GET /api/v1/insights/:slug` — detail; gated download for theses
- [ ] `GET /api/v1/glossary` — terms + definitions
- [ ] `GET /api/v1/press` — releases, media coverage, media kit metadata
- [ ] `GET /api/v1/faq` — categorized real questions
- [ ] **Live engagement ticker**: `GET /api/v1/metrics/ticker` — active engagements, sectors, capabilities deployed (from `engagement` schema, public aggregate)
- [ ] **Holding-company visualizer data**: `GET /api/v1/visualizations/holding-tree` — nested JSON tree

### 3.5 Layer 02 — Lead Qualification APIs (Week 5–7)
- [ ] **Engagement Readiness Diagnostic**: `POST /api/v1/diagnostics/start`, `POST /api/v1/diagnostics/:id/answer`, `GET /api/v1/diagnostics/:id/result`
  - Branching logic server-side based on answers
  - Outputs routing decision + generates PDF summary (HTML→PDF via Go lib)
  - Stores lead in `lead_qual.diagnostics`
- [ ] **Project Scope Estimator**: `POST /api/v1/estimates` — configurator; returns components, weeks-band, price-band, sample architecture
  - Lead captured + emailed to sales
- [ ] **RFP / Tender Submission**: `POST /api/v1/rfps` — structured upload; auto-extracts deadline, scope, criteria
  - File upload to S3; metadata to DB; internal routing + SLA tracking
- [ ] **Newsletter Signup**: `POST /api/v1/newsletter/subscribe` — segmented (sector updates, Labs releases, hiring, thought pieces)
  - Preference management; double opt-in
- [ ] **Graceful Decline Path**: automatic routing for below-threshold prospects with named alternatives + resources

### 3.6 Layer 05 — Careers APIs (Week 7–8)
- [ ] `GET /api/v1/careers/roles` — open roles list
- [ ] `GET /api/v1/careers/roles/:slug` — full role page (project examples, comp philosophy, process)
- [ ] `POST /api/v1/careers/roles/:slug/apply` — application submission (resume upload, cover, fields)
- [ ] `POST /api/v1/careers/talent-network` — domain-interest expression
- [ ] Application status tracking foundation (table + basic state machine: received → under_review → interview → offer → decline)

### 3.7 Layer 06 — Knowledge APIs (Week 8)
- [ ] `GET /api/v1/insights` (already in Layer 01) extended with type filter (field_note / thesis / whitepaper)
- [ ] Gated download for theses: `POST /api/v1/insights/:slug/download` — requires email capture; generates signed PDF URL
- [ ] Annotated bibliography table + `GET /api/v1/bibliography`
- [ ] Audio brief metadata + podcast feed skeleton (`/api/v1/feed/audio`)

### 3.8 Layer 08 — Cross-Cutting Features for Phase A (Week 8–9)
- [ ] **Universal Search (public)**: `GET /api/v1/search?q=&type=&lang=` — FTS across content tables; typo-tolerant via `pg_trgm`; sub-200ms
- [ ] **Bilingual EN/FR**: All API responses accept `?lang=` or `Accept-Language`; CMS content stores both languages
- [ ] **Dark/Light mode**: CSS variable system; portal defaults dark; public defaults light
- [ ] **SEO**: JSON-LD endpoints per entity; sitemap.xml generation; robots.txt
- [ ] **Analytics**: Plausible/PostHog frontend integration + internal aggregate endpoints
- [ ] **PWA**: manifest, service worker scaffold, offline caching for public pages
- [ ] **Accessibility**: WCAG AA markup; keyboard nav; `prefers-reduced-motion` respected

### 3.9 Frontend — Phase A Pages (Week 1–10, parallel)
- [ ] Next.js project init with App Router, Tailwind, Motion, next-intl
- [ ] Design token config (3 colors + Inter Tight)
- [ ] Layout components: navigation, footer, section markers, hairline rules, asymmetric/symmetric layouts
- [ ] **Home**: scroll-driven narrative (hero → ticker → holding-company tree → services → Labs → dossiers → manifesto → CTA)
- [ ] **About**, **Services** (5 pages), **Labs** (overview + ILIVVON), **Subsidiaries**
- [ ] **Work** (filterable index + detail), **Industries** (index + detail)
- [ ] **Insights** (index + detail + gated download), **Glossary**, **FAQ**, **Press**
- [ ] **Contact / Intake Hub**: diagnostic flow, scope estimator, RFP upload, newsletter signup
- [ ] **Careers** (roles + detail + apply form + talent network)
- [ ] Search overlay (command palette style)
- [ ] PWA manifest + offline fallback page

### 3.10 Integration & Acceptance — Phase A (Week 10)
- [ ] End-to-end tests for critical paths (diagnostic → PDF, apply → email, search → results)
- [ ] Lighthouse 95+ on all public pages (Performance, Accessibility, Best Practices, SEO)
- [ ] Ghana 4G benchmark: TTFB < 200ms from Accra; LCP < 1.8s
- [ ] Security scan: zero high-severity vulnerabilities
- [ ] Penetration test on auth layer

---

## 4. Phase B — Infrastructure (Weeks 6–16, overlapping)

> Goal: Client portal in full. First live engagements (24H+ Authority, Fastcare) onboarded.

### 4.1 Portal Authentication & Access (Week 6–8)
- [ ] OAuth2 SSO: Google + Microsoft login
- [ ] SAML/OIDC enterprise adapter (foundation)
- [ ] MFA mandatory enforcement (no exceptions)
- [ ] Role-based workspace access: `Executive`, `Project`, `Viewer`
- [ ] White-label mode: custom domain, logo, colors, email-from address per workspace
- [ ] Audit log: 100% of writes + 100% of authenticated reads captured

### 4.2 Engagement Schema Expansion (Week 6–7)
- [ ] `engagement` schema: engagements, milestones, budget_lines, invoices, payments
- [ ] `comms` schema: threads, comments, notifications, activity_feed
- [ ] `portal_config` schema: workspace_settings, white_label_configs, api_keys

### 4.3 Layer 03 — Client Portal APIs (Week 8–14)
- [ ] `GET /api/v1/portal` — multi-engagement overview
- [ ] `GET /api/v1/portal/engagements/:id/dashboard` — phase status, milestone progress, sprint, focus, blockers, activity
- [ ] **Deliverables Vault**: CRUD + versioning + diff viewer metadata + download history + role-scoped visibility
- [ ] **Decision Log**: CRUD; timestamped rationale, alternatives, decision-maker, linked artefacts
- [ ] **Stakeholder Map**: visual graph data (editable)
- [ ] **Risk Register**: CRUD; owner, mitigation, residual rating, escalation status; linked to decisions
- [ ] **Capability Lattice Tracker**: delivered / in-flight / queued / deferred mapping
- [ ] **Budget & Milestone Tracker**: burn vs budget, invoiced/outstanding, currency exposure (USD/GHS/EUR), forecast
- [ ] **Invoices & Payments**: invoice generation, status, Stripe + Paystack payment links
- [ ] **Approval Workflows**: deliverable sign-off routing; conditional approval; rejection with comments
- [ ] **Threaded Comms**: discussions on deliverables, decisions, risks; email digests; in-app notifications
- [ ] **Embedded Demos**: SSO link to preview environments
- [ ] **Reports Library**: quarterly reviews, board packs, handover docs; role-scoped; exportable
- [ ] **Document Library**: onboarding, runbooks, contracts, NDAs, SLAs (separate from deliverables)
- [ ] **Team Directory**: XCreativs staff on engagement; role; availability
- [ ] **Support Tickets**: issue raising; SLA tracking; response targets visible to client
- [ ] **Settings & Access Control**: client self-manages users, roles, permissions, notification preferences
- [ ] **Multi-engagement view**: unified portal home; switch without re-auth

### 4.4 Layer 05 — Full Applicant Tracking (Week 10–12)
- [ ] Full state machine + automated email transitions
- [ ] Interview scheduling integration
- [ ] Technical assessment challenges (foundation)

### 4.5 Layer 08 — Notifications System (Week 12–14)
- [ ] Unified dispatcher: email, in-app, WhatsApp/SMS (optional for executives)
- [ ] Per-user preferences + digest options
- [ ] Segmented delivery: visitors, prospects, clients, partners, candidates

### 4.6 Phase B Acceptance
- [ ] MFA enforced for 100% of authenticated users
- [ ] Audit log: 100% coverage of writes + authenticated reads
- [ ] Uptime 99.9% measured monthly
- [ ] White-label workspace live for at least one test client
- [ ] PWA offline mode for dashboard, deliverables, decisions, risks

---

## 5. Phase C — Compounding (Weeks 16–24, overlapping)

> Goal: Partner layer, interactive tools, AI concierge, API. Platform becomes unforkable.

### 5.1 Layer 04 — Partner & Collaborator Portal (Week 16–20)
- [ ] Partnership application intake
- [ ] Active partner dashboard: product status, dev progress, revenue share, IP ownership tracker
- [ ] Co-development workspace (mirror of client workspace)
- [ ] Referral programme tracking
- [ ] Distribution partner layer: orders, training, regional performance, commission tracking

### 5.2 Layer 07 — Interactive Tools & Public Utilities (Week 18–22)
- [ ] Digital Systems Readiness Assessment (15–20 Q → score across 5 dimensions)
- [ ] AI Maturity Score
- [ ] Tech Debt Estimator
- [ ] Document Intelligence Demo (public doc upload → structured extraction)
- [ ] Capability Lattice Explorer (interactive grid)
- [ ] Holding Company Visualiser (animated tree)
- [ ] Value Flow Animation data endpoints
- [ ] Project Configurator / Engagement Cost Calculator
- [ ] Live Engagement Counter (real-time WebSocket or SSE)

### 5.3 Layer 08 — AI Concierge (Week 20–22)
- [ ] RAG-based XC Assistant on firm's document corpus
- [ ] Public site integration (chat widget)
- [ ] Portal integration (deeper workspace queries)
- [ ] No hallucinated capability claims; grounded in CMS + knowledge base

### 5.4 Layer 03 — API Access (Week 22–23)
- [ ] Scoped API keys per workspace
- [ ] Endpoints: deliverables, decisions, milestones, audit log (read-only for clients)
- [ ] Rate limiting + key rotation

### 5.5 Layer 06 — Rich Media (Week 22–24)
- [ ] Annotated bibliography (full)
- [ ] Audio brief generation (TTS pipeline) + podcast feed
- [ ] Webinars & events: registration, calendar, replays, CRM segmentation

### 5.6 Phase C Acceptance
- [ ] API response time < 200ms for 95th percentile
- [ ] AI Concierge accuracy benchmark (human review)
- [ ] Document Intelligence demo conversion rate tracked

---

## 6. Critical Non-Functional Requirements

| Concern | Requirement |
|---------|-------------|
| **Performance** | Lighthouse 95+ all categories; TTFB < 200ms Accra; LCP < 1.8s 4G |
| **Accessibility** | WCAG AA; keyboard nav; screen-reader tested; reduced-motion respected |
| **Security** | Zero high-severity vulns; MFA mandatory; parameterized SQL; CSP; HSTS; audit log 100% |
| **Availability** | 99.9% monthly uptime; status page on separate subdomain |
| **Sovereignty** | Self-hosted option ready; data residency controls; client owns data (API export) |
| **Scalability** | Connection pooling; read replicas ready; CDN for static assets; horizontal stateless backend |
| **Observability** | Structured logs; distributed tracing; error tracking; performance metrics |

---

## 7. Open Decisions to Resolve

1. **CMS**: Build lightweight admin in Go + React, or integrate Sanity/Payload? **Decision**: Build internal CMS in Phase A (simpler, sovereign), migrate to headless later if needed.
2. **Auth provider**: Custom JWT vs Clerk/NextAuth? **Decision**: Custom (sovereignty + raw SQL requirement).
3. **Domain strategy**: Single domain path-based (`/portal/*`). Subdomains deferred.
4. **White-label**: Client subdomains require wildcard TLS; architect from day one, enable in Phase B.
5. **AI Concierge**: Default Phase C; can bring forward if Phase A finishes early.
6. **Hosting**: Self-hosted on Hetzner/DigitalOcean with EU + Ghana edge (Cloudflare). No Vercel for backend.

---

## 8. File Structure (Backend)

```
backend/
├── cmd/
│   ├── api/              # HTTP server entrypoint
│   ├── worker/           # Background job processor (emails, PDF gen, TTS)
│   └── migrate/          # CLI for migrations
├── internal/
│   ├── domain/           # Entities, value objects, domain events, repository interfaces
│   ├── usecases/         # Application layer: command + query handlers
│   ├── adapters/
│   │   ├── http/         # Chi handlers, middleware, DTOs
│   │   ├── db/           # PostgreSQL repository implementations (raw SQL)
│   │   ├── cache/        # Redis implementations
│   │   ├── storage/      # S3-compatible file storage
│   │   ├── email/        # Resend adapter
│   │   ├── search/       # Postgres FTS helpers
│   │   └── ai/           # OpenAI/Anthropic adapter (Phase C)
│   └── config/           # Env config, constants
├── pkg/
│   ├── validator/        # Custom validators
│   ├── logger/           # Slog setup
│   ├── jwt/              # Token generation/validation
│   ├── password/         # Bcrypt wrapper
│   ├── mfa/              # TOTP logic
│   └── pdf/              # HTML→PDF generation
├── migrations/
│   ├── 001_enums.up.sql
│   ├── 002_content.up.sql
│   ...
├── seeds/
│   └── seed.sql
├── tests/
│   ├── integration/      # DB-backed tests
│   └── e2e/              # Full stack tests
├── Makefile
├── go.mod
└── Dockerfile
```

---

## 9. Build Order (1 → 100)

This is the execution sequence. Each item is a commit-sized unit of work.

**Week 1: Foundation**
1. Initialize repo structure, Go module, Docker Compose
2. Configure `slog`, environment loader, health endpoint
3. Wire `chi` router with middleware chain (request ID, recover, CORS, rate limit)
4. Set up `golang-migrate`; create migration 001 (enums)
5. Implement PostgreSQL connection pool (`pgxpool`) with config

**Week 2: Content & Identity Schema**
6. Migration 002: `content` schema tables
7. Migration 003: `identity` schema tables
8. Seed data: services, labs, case dossiers, industries, insights, glossary, FAQ
9. Define domain entities and repository ports for content
10. Implement content repository adapters (raw SQL)

**Week 3: Auth & Cross-Cutting**
11. Password hashing (`bcrypt`) + JWT access/refresh tokens
12. Register / login / logout HTTP handlers
13. TOTP MFA enrollment and verification
14. Audit log middleware
15. RBAC middleware + permission checks

**Week 4: Public Surface APIs (Part 1)**
16. `GET /api/v1/pages/home` with ticker data
17. `GET /api/v1/pages/about`
18. `GET /api/v1/services` + `/:slug`
19. `GET /api/v1/labs` + `/:slug`
20. `GET /api/v1/subsidiaries`

**Week 5: Public Surface APIs (Part 2)**
21. `GET /api/v1/work` + `/:slug` (filterable)
22. `GET /api/v1/industries` + `/:slug`
23. `GET /api/v1/insights` + `/:slug`
24. `GET /api/v1/glossary`, `/faq`, `/press`
25. Live engagement ticker endpoint + aggregate queries

**Week 6: Lead Qualification**
26. Migration 004: `lead_qual` schema
27. Diagnostic question bank + branching engine
28. `POST /api/v1/diagnostics/*` flow
29. PDF summary generation for diagnostic result
30. Scope estimator configurator + `POST /api/v1/estimates`

**Week 7: RFP, Newsletter, Careers**
31. RFP submission endpoint + file upload to S3
32. Newsletter signup with segmentation
33. Graceful decline automation
34. Migration 005: `talent` schema
35. Careers roles endpoints + application submission

**Week 8: Knowledge, Search, Frontend Kickoff**
36. Gated download for theses (signed PDF URL)
37. Annotated bibliography endpoint
38. Audio brief podcast feed skeleton
39. Postgres FTS search implementation (`pg_trgm`)
40. `GET /api/v1/search` public endpoint
41. Next.js project init + Tailwind + design tokens
42. Layout components (nav, footer, hairlines, section markers)

**Week 9: Frontend Pages (Part 1)**
43. Home page: hero, ticker, holding-company tree, services, Labs, dossiers, manifesto, CTA
44. About page
45. Services pages (5)
46. Labs overview + ILIVVON product page
47. Work index + detail pages

**Week 10: Frontend Pages (Part 2) + Acceptance**
48. Industries, Insights, Glossary, FAQ, Press
49. Contact/Intake hub (diagnostic flow, estimator, RFP, newsletter)
50. Careers pages (roles, apply, talent network)
51. Search overlay + command palette
52. PWA manifest + service worker
53. SEO: JSON-LD, sitemap, robots
54. Lighthouse audit + performance optimization
55. Security scan + penetration test on auth
56. **PHASE A SHIPPED**

**Week 11–12: Portal Schema + Auth Deepening**
57. OAuth2 Google + Microsoft login
58. SAML/OIDC foundation
59. Migration: `engagement`, `comms`, `portal_config` schemas
60. Workspace creation + user invitation flow
61. White-label config storage

**Week 13–14: Client Portal APIs (Core)**
62. Portal dashboard + multi-engagement view
63. Deliverables vault (CRUD, versioning, signed URLs)
64. Decision log + stakeholder map
65. Risk register + capability lattice tracker
66. Budget & milestone tracker

**Week 15–16: Portal APIs (Operations)**
67. Invoices + Stripe/Paystack integration
68. Approval workflows
69. Threaded comms + notifications
70. Reports library + document library
71. Team directory + support tickets
72. Settings & access control

**Week 17: Frontend Portal + PWA Offline**
73. Portal shell (dark mode, sidebar nav)
74. Dashboard + engagement switcher
75. Deliverables, decisions, risks UI
76. Offline caching for key views
77. **PHASE B SHIPPED**

**Week 18–20: Partner Portal**
78. Migration: `partner` schema
79. Partner application intake
80. Active partner dashboard
81. Co-development workspace
82. Referral + distribution tracking

**Week 21–22: Interactive Tools**
83. Readiness assessment API
84. AI maturity score API
85. Tech debt estimator API
86. Document intelligence demo (doc upload → extraction)
87. Capability lattice explorer data
88. Live engagement counter (SSE/WebSocket)

**Week 23: AI Concierge + API Access**
89. RAG pipeline on document corpus
90. XC Assistant chat API
91. Public widget + portal integration
92. Scoped API keys + client data endpoints

**Week 24: Rich Media + Final Polish**
93. Audio brief TTS pipeline
94. Webinars & events registration
95. Analytics internal dashboard endpoints
96. Final security review by external practitioner
97. Ghana network performance benchmark
98. Documentation + runbooks
99. Load testing + read replica validation
100. **PHASE C SHIPPED — PLATFORM LIVE**

---

## 10. Implementation Status (as of build)

- **Phase A — DONE.** Public surface, intake, careers, knowledge, search, SEO, PWA.
- **Phase B — DONE.** Full client portal (deliverables, decisions, risks, stakeholder map, capability-lattice
  tracker, milestones, budget, invoices + Stripe/Paystack links, approvals, threaded comms, reports, documents,
  team, tickets, embedded demos, white-label, multi-engagement), OAuth + generic OIDC enterprise SSO, mandatory
  MFA enforcement, audit log, ATS (interview scheduling + technical assessment challenges + email transitions),
  unified notification dispatcher (in-app + email + Twilio SMS/WhatsApp) with per-user prefs + digests + segmented broadcast.
- **Phase C — DONE.** AI Concierge corpus RAG (FTS retrieval + citations, env-gated LLM generation),
  Live Engagement Counter SSE, Value-Flow + Capability-Lattice-Explorer endpoints, Tech-Debt + Cost-Calculator
  backends, audit-log client export, partner co-development workspace, distribution layer
  (training + commission/regional performance), audio-brief TTS pipeline (env-gated), document-intelligence file upload.
- **Phase D — SCAFFOLDED.** golangci-lint config; testify unit tests (config validation + pure logic + Resend + Cloudinary);
  testcontainers integration test (`-tags=integration`, real Postgres, repo round-trips); Playwright e2e smoke;
  k6 load script; expanded GitHub Actions CI (lint → unit → integration → migrations round-trip → frontend → e2e + OpenAPI-sync check);
  `render.yaml` (backend + Postgres + Redis Blueprint) and `frontend/vercel.json`.
- **Integrations:** email via **Resend** (`pkg/email`); media/file uploads via **Cloudinary** (`pkg/storage`, `POST /uploads` + generated-TTS audio).
- **API docs:** OpenAPI 3 generated from the live router (`cmd/genopenapi` → embedded `internal/apispec/openapi.yaml`),
  **Swagger UI at `/docs`**, **Postman collection** (`docs/postman_collection.json`); all keys catalogued in `docs/API_KEYS.md`.

- **Current pass — Phase D hardening + UI/UX redesign (in progress, as of 13 Jun 2026):**
  - **CI repair (backend — DONE, verified):** the migrations never reproduced a fresh DB — added the four tables that had been created outside the migration history (`identity.api_keys`, `partner.applications`, `interactive.chat_sessions`, `interactive.chat_messages`) and fixed `015_indexes` ordering, so a clean DB now builds all **81 tables** and `up` + `down -all` round-trips cleanly. Aligned the toolchain to **Go 1.25** (`go.mod` / CI / Dockerfile), migrated **golangci-lint to v2**, and fixed all 20 findings. Backend `lint / vet / test / build / integration (testcontainers) / OpenAPI-sync` all green; fixed a latent integration-test bug (it queried `schema_migrations` without creating it).
  - **Frontend lint cleanup (in progress):** clearing ~134 pre-existing lint errors (no-explicit-any, html-link-for-pages, set-state-in-effect) → 0, then one production `next build`, then first commit/push.
  - **UI/UX redesign (supersedes the original 3-token + Inter Tight system):** type system now **Fraunces (display) + Hanken Grotesk (body)**; refined cool palette on the signal-blue accent; reusable decoration system (animated constellation hero backdrop, drifting glows, grid + grain, `card-x` cards, gradient text); **navbar mega-dropdowns** (14 flat links → Services/Insights/Company + Work + Contact CTA); **dark editorial footer** with iconned columns; **`PageBanner`** (decorative icon + breadcrumbs + title + description) on 18 pages; branded **404** + CSS **splash screen**; cards restyled site-wide; **About** + **Partners** pages rebuilt; generated hero imagery in `public/media`. Fixed a **dev service-worker reload loop**.
  - **Decisions superseded since v1.0:** File storage = **Cloudinary** (not Cloudflare R2); Hosting = **Render** (backend Docker Blueprint) + **Vercel** (frontend); Frontend = **Next.js 16**.

---

## 11. Phase D — Testing, Quality & Deployment

> Goal: production confidence + repeatable deploys. Backend → Render (Docker Blueprint). Frontend → Vercel.

### 11.1 Testing
- **Unit (Go):** `testify` assertions + `uber-go/mock` (gomock) for repository/port interfaces; cover use-case logic,
  the concierge RAG ranking, PDF generation, JWT/MFA, validators. Target: domain + handler logic.
- **Integration (Go):** `testcontainers-go` spins an ephemeral Postgres 16; run migrations, exercise repositories
  and HTTP handlers against a real DB (no mocks) for the critical flows (auth, diagnostics, portal CRUD, partner, RAG).
- **E2E (frontend):** `Playwright` against a running stack — public intake → diagnostic → PDF, login → portal,
  careers apply, concierge chat. Run headless in CI.
- **Load:** `k6` scripts for the public read paths + search + concierge; assert p95 < 200 ms (spec NFR).

### 11.2 Linting & quality gates
- Backend: `golangci-lint` (govet, staticcheck, errcheck, gosec, revive) — config at `backend/.golangci.yml`.
- Frontend: `eslint` (already configured) + `tsc --noEmit` typecheck.
- Pre-commit optional; enforced in CI.

### 11.3 CI (GitHub Actions)
- `backend` job: lint → vet → unit → integration (testcontainers) → build.
- `frontend` job: install → lint → typecheck → build → Playwright e2e.
- `migrations` job: up + down round-trip against a Postgres service.
- `load` job (manual/scheduled): k6 smoke.

### 11.4 Deployment
- **Backend → Render** via `render.yaml` Blueprint: Dockerized API service + managed Postgres + Redis;
  `ENV=production`, secrets as Render env vars, `make migrate-up` as a pre-deploy/release step.
- **Frontend → Vercel:** `vercel.json` / project settings; `NEXT_PUBLIC_API_URL` + `API_PROXY_URL` → Render API URL;
  preview deploys per PR.
- TLS + custom domains at both edges; status page on a separate subdomain.

---

*Plan version: 1.1*  
*Aligned with specification v1.0; Phases A & B complete, C in progress, D (test/deploy) scoped.*
