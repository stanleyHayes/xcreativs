# Monorepo split — marketing + portal (in progress)

Goal: split the single Next.js 16 app into a workspace monorepo with two deployable apps:
- `apps/marketing` → **xcreativs.com**
- `apps/portal` → **portal.xcreativs.com** (client portal + role-gated `/portal/admin`; admin is NOT a separate app)
Shared code in `packages/{ui,api,i18n}`. Tooling: **npm workspaces + Turborepo** (keep npm).

Backend stays shared (Render). Auth is **Bearer token in localStorage** (origin-scoped, NOT cookies) — so the portal owns the `login`/`auth` routes; marketing links to the portal login URL.

## Target layout
```
xcreatives/
  package.json (workspaces: apps/*, packages/*), turbo.json, tsconfig.base.json
  apps/marketing/   (Navigation, Footer, HomePage, SplashScreen, ScrollToTop, decor/HeroBackdrop, AnalyticsScript, PWAUpdatePrompt, OfflineIndicator + all marketing routes)
  apps/portal/      (portal/** routes, login, auth/sso, offline; ClientThemeProvider, NotificationBell, portal/ThreadedComments)
  packages/ui/      @xc/ui    — styles.css (design system), ThemeProvider, CurrencyProvider, PageBanner, FileUpload, Skeleton, ErrorBoundary, concierge/ChatWidget
  packages/api/     @xc/api   — api.ts, types.ts, useApi.ts, pwa/sync.ts
  packages/i18n/    @xc/i18n  — config.ts, request.ts (static message imports), navigation.ts, messages/{en,fr}.json
```

## Steps (each committable + CI-green; verify via CI build, not local)
- [x] **A. Relocate** `frontend/` → `apps/marketing/` — DONE, CI green (commit bfb110d).
- [x] **0. Workspace scaffold**: npm workspaces (no turbo yet); single root package-lock.json (CLEAN-regenerated for all-platform optional deps — see gotcha #1b); CI = root `npm ci` + `npm run <script> --workspace=apps/marketing`; next.config.ts→.mjs. DONE, CI green (commit 4edeeaf).
- [x] **1. `@xc/i18n`**: moved i18n + messages; request.ts now static JSON imports; plugin path `../../packages/i18n/src/request.ts`; proxy imports `@xc/i18n/config`; transpilePackages. DONE, CI green (commit 2e72c0c).
- [x] **2. `@xc/api`**: moved lib/{api,types,useApi}+pwa; codemod `@/lib/api`→`@xc/api`, `@/lib/types`→`@xc/api/types` (92 refs); transpilePackages. DONE, CI green (commit dafdb73). NOTE: api.ts 401 `window.location.href="/login"` still origin-local — make origin-aware in Step 5.
- [x] **3. `@xc/ui`**: moved globals.css→packages/ui/src/styles.css (REMOVE its `@import "tailwindcss"`); move shared components (ThemeProvider, CurrencyProvider, PageBanner, FileUpload, Skeleton, ErrorBoundary, concierge/ChatWidget — all have NO internal `@/` imports; FileUpload imports `@xc/api` so @xc/ui deps on @xc/api; none use next-intl). New app `src/app/globals.css` = `@import "tailwindcss";` + `@import "@xc/ui/styles.css";` + `@source "../../../../packages/ui/src/**/*.{ts,tsx}";` (GOTCHA #2 — without @source the package's classes are purged: build passes but renders unstyled). Keep next/font calls in app layout (vars --font-fraunces/--font-hanken consumed by styles.css @theme). Codemod `@/components/{Comp}`→`@xc/ui/{Comp}`. @xc/ui package.json: deps {@xc/api, lucide-react}, peer {react, react-dom, next}. **Verify the site is actually styled, not just that it builds.**
- [x] **4. `apps/portal` shell**: scaffolded app (next.config, proxy.ts, tsconfig, postcss, eslint, public, [locale]/layout + globals + placeholder page); portal layout has NO marketing nav/footer and is `robots:noindex`; dev/start on port 3002. CI `frontend` job → matrix `app:[marketing,portal]`. Root lockfile regenerated (linux+darwin optional deps preserved). Typecheck+lint clean locally.
- [x] **5. Move portal routes** (working tree, UNCOMMITTED per user): moved `portal/**` (41 routes), `login`, `auth/sso` → apps/portal; copied `offline` (both apps need it); moved the 3 portal-only components (ClientThemeProvider, NotificationBell, portal/ThreadedComments). Marketing `/login` → server `redirect()` to `${NEXT_PUBLIC_PORTAL_URL||"http://localhost:3002"}${localePrefix}/login` (verified 307). `@xc/api` 401 now origin-aware: `window.location.href = \`${NEXT_PUBLIC_PORTAL_URL||""}/login\`` (resolves the Step-2 TODO). Added `NEXT_PUBLIC_PORTAL_URL` to marketing .env.example + portal .env.example. Split e2e: marketing keeps home/careers/tools + a login-redirect assertion; portal gets login + landing specs + its own playwright.config (port 3002) + `test:e2e` script + `@playwright/test`. CI `e2e` job → matrix `app:[marketing,portal]`. **Verified locally:** both apps typecheck+lint clean; portal dev server runs on :3002 with /, /login, /portal, /portal/admin, /fr/login all 200; marketing 200; lockfile guard intact. NOT yet CI-verified (uncommitted) or committed.
  - [x] FOLLOW-UP DONE: marketing Navigation now has a locale-aware "Sign In"/"Connexion" link (desktop + mobile) → `localizeHref("/login")` → the marketing redirect → portal. Added `nav.signIn` to en/fr messages + `LogIn` icon. (Verified: renders href="/login" en, "/fr/login" fr.) Marketing `/auth/sso` redirect intentionally NOT added (SSO is portal-initiated; callbacks land on the portal origin).
- [~] **6. Deploy** (PREP underway, uncommitted): **Turborepo added** — root `turbo.json` (build/lint/typecheck/dev tasks, `^build` deps, `.next` outputs, env passthrough for NEXT_PUBLIC_*/API_PROXY_URL) + root scripts (`turbo run …`) + `turbo@^2.5` (resolved 2.9.18) + `packageManager: npm@11.3.0` (turbo 2.9 requires it). Verified `turbo run typecheck` runs both apps. CI still on per-workspace `npm run` (works; can move to `turbo run --filter` later). Both `vercel.json` FINALIZED: dropped `installCommand:"npm ci"` (Vercel installs from repo root via the single root lockfile — hardcoded npm ci breaks @xc/* workspace linking), set `buildCommand:"turbo run build"` + `ignoreCommand:"npx turbo-ignore <app> --fallback=HEAD^1"`. turbo.json on the turbo-2.9 `turborepo.dev` schema; `^build` kept only on `build` (packages are raw TSX, nothing to prebuild for lint/typecheck). Full runbook WRITTEN → **docs/DEPLOY.md** (329 lines, verified vs current Vercel monorepo docs). REMAINING (needs user's Vercel/Render accounts + a push, all scripted in DEPLOY.md): create 2 Vercel projects (Root Directory `apps/marketing` / `apps/portal`, Node 22, "Skip unaffected" on), set env per §4, attach domains + DNS (§5), set Render `ALLOWED_ORIGINS=https://xcreativs.com,https://www.xcreativs.com,https://portal.xcreativs.com` + `API_PROXY_URL`=Render URL on both projects.
  - **API architecture (matters for deploy):** browser API calls are RELATIVE `/api/*` → proxied by each app's next.config rewrite to `API_PROXY_URL` (the Render backend). Same-origin in the browser ⇒ **no CORS**. So on Vercel, set `API_PROXY_URL` (server) = Render URL on BOTH projects; backend CORS is only a fallback for any direct cross-origin caller. `api.ts` uses the absolute URL only during SSR (`typeof window === undefined`).

## CI (final)
Replace single `frontend` job with a matrix `app: [marketing, portal]`, root `npm ci`, `npx turbo run lint typecheck build --filter=${app}...`; same for `e2e`. Keep backend/integration/migrations jobs.

## Key risks
1. **next-intl**: keep `next-intl` a peerDependency in packages (single hoisted copy) or you get "No intl context". Plugin path = relative `../../packages/i18n/src/request.ts`.
2. **Tailwind v4 content scanning**: app `globals.css` must add `@source "../../../../packages/ui/src/**/*.{ts,tsx}"` or package classes get purged (builds-but-looks-broken).
3. **next/font** must be called in app code (each app layout), not in a shared package; share only the `--font-*` CSS-variable contract.
4. **request.ts** relative `import(../../messages/...)` → static `import en from "../messages/en.json"`.
5. **Auth**: localStorage is origin-scoped → portal owns login; marketing 401 redirect + login link must point to `https://portal.xcreativs.com/login`.
6. **transpilePackages: ["@xc/ui","@xc/api","@xc/i18n"]** in each app's next.config (packages ship raw TSX).
7. Single root `package-lock.json` → CI cache key changes (first run is a miss).
