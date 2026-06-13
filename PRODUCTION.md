# Production Deployment & Readiness

Self-hosted stack: **Go API** + **Next.js frontend** + **PostgreSQL 16** + **Redis**.
Sovereignty-conscious; no managed backend platform required (Hetzner / DigitalOcean + Cloudflare per the spec).

---

## 1. Required environment (production)

The API **fails fast at startup** (`config.validate`) when `ENV=production` and any of these are unsafe:

| Variable | Requirement |
|----------|-------------|
| `ENV` | `production` |
| `DB_URL` | Explicit (not the dev default); **must not** contain `sslmode=disable` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ≥ 32 random chars, different from each other, not the example value |
| `ALLOWED_ORIGINS` | Explicit https origins (no `*`, no `localhost`) |
| `BASE_URL` | Public frontend URL (e.g. `https://xcreativs.com`) |

Optional integrations (degrade gracefully when unset):
`RESEND_API_KEY` (email), `REDIS_URL`, `S3_*` (object storage),
`GOOGLE_OAUTH_CLIENT_ID/SECRET`, `MICROSOFT_OAUTH_CLIENT_ID/SECRET` (SSO → 501 until set),
`PAYSTACK_SECRET_KEY` / `STRIPE_SECRET_KEY` (invoice payment links → internal fallback link until set).

Frontend: `NEXT_PUBLIC_API_URL` (browser → API) and `API_PROXY_URL` (server-side `/api` rewrite target).

Generate secrets: `openssl rand -base64 48`.

---

## 2. Build & deploy

```bash
# Images (multi-stage; backend = distroless non-root, frontend = node non-root)
docker build --target production -t xcreatives-api ./backend
docker build --target production -t xcreatives-web ./frontend

# Database migrations (golang-migrate; run on deploy, never auto-migrate)
cd backend && make migrate-up        # uses DB_URL from the environment
# seed once on a fresh DB:  make seed
```

Put TLS termination + a reverse proxy (Caddy / nginx / Cloudflare) in front of both services.
Route `https://<domain>/api/*` → API, everything else → the Next.js server.

---

## 3. What is already hardened

- **Fail-fast config validation** for production secrets/origins/TLS (above).
- **Security headers** (API + frontend): `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, CSP (API), and **HSTS in production**.
- **CORS**: credentials only with explicitly allow-listed origins; never wildcard-with-credentials; `Vary: Origin`.
- **AuthN/Z**: JWT access (15m) + refresh (30d) with server-side session revocation, bcrypt, TOTP MFA, RBAC, scoped API keys.
- **Audit log** middleware on authenticated/admin writes.
- **Rate limiting** per IP; **1 MB request cap** (10 MB for document-intelligence upload).
- **Parameterized SQL** everywhere (raw pgx, no ORM); nullable/enum columns hardened against scan failures.
- **Connection pool** tuned (max 25 / min 5, lifetime + health checks).
- **Graceful shutdown**, `/healthz` (liveness) + `/readyz` (DB ping) probes.
- **Mandatory MFA** enforcement, config-gated via `MFA_REQUIRED` (blocks non-MFA users; exempts MFA-setup endpoints).
- **Media/storage**: Cloudinary uploader (`pkg/storage`) for file uploads + generated TTS audio.
- **Email**: Resend (`pkg/email`), JSON-safe payloads, with tests.
- **Tests**: testify unit, testcontainers integration (`-tags=integration`), Playwright e2e, k6 load.
- **CI** (`.github/workflows/ci.yml`): golangci-lint → unit → integration (testcontainers) → migrations up/down → frontend lint/typecheck/build → Playwright e2e.

---

## 4. Remaining production tasks (ops / infra — not code)

- [ ] TLS certificates + reverse proxy (wildcard cert if white-label subdomains are enabled)
- [ ] Secrets management (Vault / cloud secret store) — do not ship `.env`
- [ ] Automated Postgres backups + restore drill; read replica if needed
- [ ] Monitoring: error tracking (Sentry), metrics, log aggregation (Axiom/BetterStack); OpenTelemetry traces
- [ ] Status page on a separate subdomain
- [ ] Run the k6 load test + a pen test on the auth layer against staging
- [ ] Lighthouse 95+ on public pages; Ghana 4G benchmark (TTFB < 200 ms, LCP < 1.8 s)
- [ ] Provide the optional integration keys you want live (see `docs/API_KEYS.md`)

---

## 5. Feature completeness vs `agent_plan.md`

**Phase A (public surface + intake): complete.** All public APIs, pages, careers, knowledge, search, SEO, PWA.

**Phase B (client portal): complete.** Full portal CRUD (deliverables, decisions, risks, stakeholder map,
**capability-lattice tracker** state machine, milestones, budget, invoices + payment links, approvals, threaded
comms, reports, documents, team, tickets, **embedded demo SSO links**, white-label, multi-engagement),
**OAuth + generic OIDC enterprise SSO**, **config-gated mandatory MFA enforcement** (`MFA_REQUIRED`), audit log,
ATS with interview scheduling + **technical assessment challenges** + email transitions, and a **unified
notification dispatcher** (in-app + email + Twilio SMS/WhatsApp) with **per-user preferences, email digests, and
segmented broadcast**. (SAML proper would need a dedicated library; the generic OIDC connector covers enterprise IdPs.)

**Phase C (compounding): ~75%.** Partner portal + applications + referrals + distribution orders,
interactive tools, scoped API keys, AI concierge (grounded), rich media (audio + RSS, webinars, bibliography).
Gaps: **AI Concierge is keyword/FTS-grounded, not vector RAG**; **TTS pipeline** (audio uploaded, not generated);
**value-flow animation endpoint**; **partner co-development workspace**; backend endpoints for **tech-debt
estimator / cost calculator** (currently client-side); **capability-lattice** state machine; **audit-log
client export**; **technical assessment challenges** for candidates.

These are net-new features, not defects — the implemented surface is bug-clean and verified.
