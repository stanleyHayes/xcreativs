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
- [x] **A. Relocate** `frontend/` → `apps/marketing/` (git mv, no code change); update CI `working-directory`/`cache-dependency-path`. ← current
- [ ] **0. Workspace scaffold**: root package.json (workspaces) + turbo.json + tsconfig.base.json; root `npm install`; CI = root `npm ci` + `turbo --filter=marketing`.
- [ ] **1. `@xc/i18n`**: move i18n + messages; rewrite request.ts to static JSON imports; repoint next-intl plugin path + proxy import; add to `transpilePackages`.
- [ ] **2. `@xc/api`**: move lib/{api,types,useApi}, pwa/sync; codemod `@/lib/*` → `@xc/api*`; make api.ts 401 redirect origin-aware.
- [ ] **3. `@xc/ui`**: move globals.css→styles.css + shared components; app globals.css = `@import "@xc/ui/styles.css"` + Tailwind v4 `@source` for packages; keep next/font calls in each app layout.
- [ ] **4. `apps/portal` shell**: scaffold app (next.config, proxy.ts, tsconfig, postcss, eslint, public, [locale]/layout + globals); add to CI matrix.
- [ ] **5. Move portal routes**: git mv `portal/**`, `login`, `auth/sso`, portal `offline`, portal-only components → apps/portal; marketing `login`/`auth` → redirect to portal URL; split e2e specs.
- [ ] **6. Deploy**: 2 Vercel projects (Root Directory per app), env (NEXT_PUBLIC_API_URL, API_PROXY_URL), map portal.xcreativs.com; Render `ALLOWED_ORIGINS=https://xcreativs.com,https://www.xcreativs.com,https://portal.xcreativs.com`; Ignored Build Step `npx turbo-ignore`.

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
