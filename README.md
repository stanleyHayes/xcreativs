# XCreativs Web Platform

Enterprise-grade web platform for XCreativs Technologies — intelligent digital systems for governments and enterprises.
Self-hosted, sovereignty-conscious, bilingual (EN/FR).

## Architecture

- **Backend**: Go 1.25, Chi router, raw PostgreSQL via `pgx/v5` (no ORM), Clean Architecture / Ports & Adapters
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, `next-intl` v4, PWA
- **Database**: PostgreSQL 16 — **81 tables across 9 bounded-context schemas** (`content`, `identity`, `lead_qual`, `talent`, `engagement`, `comms`, `portal_config`, `partner`, `interactive`); **24 versioned migrations** (golang-migrate)
- **Auth**: JWT (15min access / 30day refresh) + server-side session revocation, bcrypt, TOTP MFA (+ optional mandatory enforcement), RBAC, scoped API keys, OAuth (Google/Microsoft) + generic OIDC enterprise SSO
- **Security**: fail-fast prod config validation, CSP + HSTS + security headers, hardened CORS, per-IP rate limiting, audit logging, parameterized SQL

## Feature map

- **Phase A — Public surface & intake:** home/about/services/labs/subsidiaries/work/industries/insights/glossary/FAQ/press, careers, full-text search, SEO (dynamic sitemap, JSON-LD, robots), PWA. Lead qualification: diagnostics (+ PDF summary), scope estimator, RFP, newsletter, bookings.
- **Phase B — Client portal:** deliverables, decisions, risks, **stakeholder map**, **capability-lattice tracker**, milestones, budget, **invoices + Stripe/Paystack payment links**, approvals, threaded comms, reports, documents, team, tickets, **embedded demo SSO links**, white-label, multi-engagement. **OAuth + OIDC SSO**, **mandatory MFA**, audit log, **ATS** (interview scheduling + technical assessment challenges + email transitions), **unified notification dispatcher** (in-app + email + Twilio SMS/WhatsApp) with per-user preferences, **email digests**, and segmented broadcast.
- **Phase C — Compounding:** partner portal (applications, products, agreements, referrals, distribution orders, **co-development workspace**, **distribution training + commission/regional performance**), interactive tools (readiness/AI-maturity assessments, **tech-debt** + **cost-calculator** + **document-intelligence** (text + file upload) + **capability-lattice explorer** + **holding-company visualiser** + **value-flow** + **live engagement counter (SSE)**), **AI Concierge corpus RAG** (FTS retrieval + citations, optional Anthropic generation), scoped API keys + **audit-log client export**, rich media (annotated bibliography, **audio briefs + RSS + env-gated TTS**, webinars).
- **Phase D — Testing & deployment:** golangci-lint, testify unit tests, testcontainers integration tests, Playwright e2e, k6 load, GitHub Actions CI, Render Blueprint + Vercel.

## Quick start

### Prerequisites

Go 1.25+ · Node.js 22+ · PostgreSQL 16+ · `golang-migrate` CLI · Docker (optional)

### Database + backend

```bash
docker-compose up -d postgres redis      # or use your own Postgres/Redis
cd backend
cp .env.example .env                      # fill in secrets (see docs/API_KEYS.md)
make migrate-up                           # apply migrations
make seed                                 # optional dev content
go run ./cmd/api                          # API on http://localhost:8081
```

### Frontend

```bash
cd frontend
npm install
npm run dev                               # http://localhost:3001
```

### All services

```bash
docker-compose up
```

## API documentation

- **Swagger UI:** run the API and open <http://localhost:8081/docs> (spec at `/openapi.yaml`).
- **OpenAPI 3 spec:** [`backend/internal/apispec/openapi.yaml`](backend/internal/apispec/openapi.yaml) — **generated from the live router** (209 operations). Regenerate with `make -C backend openapi`.
- **Postman collection:** [`docs/postman_collection.json`](docs/postman_collection.json) — import into Postman, set the `baseUrl` + `token` variables.

> The spec is embedded into the binary (`go:embed`), so `/docs` works in the distroless container too. It never drifts — it's regenerated from the router, not hand-maintained.

## Testing

```bash
# Backend
cd backend
go test ./...                              # unit
go test -tags=integration ./internal/adapters/db/...   # integration (Docker required, testcontainers)
golangci-lint run ./...                    # lint

# Frontend
cd frontend
npm run typecheck && npm run lint && npm run build
npm run test:e2e                           # Playwright (builds + serves)

# Load
BASE_URL=http://localhost:8081 k6 run load/k6-smoke.js
```

CI runs all of the above on push/PR (`.github/workflows/ci.yml`).

## Deployment

- **Backend → Render** (Docker Blueprint): [`render.yaml`](render.yaml) provisions the API + managed Postgres + Redis.
- **Frontend → Vercel:** [`frontend/vercel.json`](frontend/vercel.json); set Root Directory = `frontend`.
- Full runbook: [`PRODUCTION.md`](PRODUCTION.md). Required + optional keys: [`docs/API_KEYS.md`](docs/API_KEYS.md).

## Project structure

```text
xcreatives/
├── backend/              # Go API (cmd/api, cmd/genopenapi, internal/{adapters,domain,usecases,config,apispec}, pkg/{email,storage,jwt,pdf})
├── frontend/             # Next.js app (src/app, src/components, src/lib, tests/e2e)
├── migrations/           # 24 versioned SQL migrations (repo root)
├── seeds/                # dev seed data
├── load/                 # k6 load scripts
├── docs/                 # API_KEYS.md, postman_collection.json
├── .github/workflows/    # CI
├── render.yaml           # Render Blueprint (backend)
├── PRODUCTION.md         # deployment & readiness runbook
└── agent_plan.md         # build plan + implementation status
```

## Security

JWT + refresh with session revocation · TOTP MFA (optionally mandatory) · RBAC + scoped API keys · per-IP rate limiting · 1 MB request cap · audit logging · parameterized SQL · CSP/HSTS/security headers · hardened CORS · fail-fast production config validation.

## Test user (seeded)

`admin@xcreativs.com` / `admin12345` (role: admin)

## License

Proprietary — XCreativs Technologies
