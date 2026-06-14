# Deploy Runbook — XCreativs

Ship one GitHub repo as **two Vercel projects** (marketing + portal) plus the **Go backend on Render**.

This runbook is accurate to **June 2026** Vercel monorepo behavior (verified against `vercel.com/docs/monorepos`, `/docs/monorepos/turborepo`, `/docs/builds/configure-a-build`, and `turborepo.dev`). Read it top to bottom for a first deploy; later sections double as a reference.

## 0. Architecture summary

```
GitHub: xcreativs (npm workspaces + Turborepo, single root package-lock.json)
│
├── apps/marketing   ─► Vercel project "xcreativs-marketing"  ─► xcreativs.com + www.xcreativs.com
├── apps/portal      ─► Vercel project "xcreativs-portal"     ─► portal.xcreativs.com
├── packages/{ui,api,i18n}  (@xc/ui @xc/api @xc/i18n — RAW TSX, transpilePackages)
│
└── backend/         ─► Render web service "xcreativs-api"    ─► https://xcreativs-api.onrender.com
```

**The load-bearing decision:** browser code calls **relative** `/api/...`. Each Next app rewrites `/api/:path*` → `${API_PROXY_URL}/api/:path*`. So in the browser, API calls are **same-origin** (the Vercel deployment), and Vercel proxies server-side to Render. This means:

- **`API_PROXY_URL` MUST be set on Vercel** to the Render service URL, on **both** projects, for **both** Production and Preview. If unset, the rewrite falls back to `http://localhost:8081` and every `/api/*` call 502s in the cloud.
- Because the browser never hits Render cross-origin, **CORS is effectively not exercised by normal app traffic** (see §6 for the nuance and why you still set `ALLOWED_ORIGINS`).

Real package names (confirmed from `package.json`): the **workspace/turbo names** are `marketing` and `portal` (NOT `@xc/...`). The shared libs are `@xc/api`, `@xc/i18n`, `@xc/ui`. This matters for `--filter` / `--packages` targets below.

---

## 1. Turborepo

### turbo.json (repo root) — recommended

Your installed `turbo` is **2.9.18**, which uses the `tasks` key (the old `pipeline` key is gone) and the `turborepo.dev` schema. Update the `$schema` URL and pin task graph + outputs:

```jsonc
// turbo.json  (repo root)
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      // Next.js output. Excluding cache keeps the Turbo/remote cache small and correct.
      "outputs": [".next/**", "!.next/cache/**"],
      // Declare anything that gets INLINED into the build so cache keys are correct.
      // NEXT_PUBLIC_* are inlined by Next at build time; API_PROXY_URL changes the
      // rewrite target baked into the server build.
      "env": ["NEXT_PUBLIC_*", "API_PROXY_URL", "NEXT_TELEMETRY_DISABLED"]
    },
    "lint": {
      // lint does not need upstream builds; it only reads source. No outputs to cache.
      "outputs": []
    },
    "typecheck": {
      // tsc --noEmit needs the shared packages' types resolvable. They ship raw TSX
      // via "exports", so ^build is NOT required for types — but keep it if any
      // package emits .d.ts. Here packages are raw source, so no dependsOn.
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Notes:
- **Do not** add `dependsOn: ["^build"]` to `lint`/`typecheck` here. Your shared packages are consumed as **raw TSX** (`transpilePackages`), so there is nothing to pre-build for type resolution — adding `^build` just slows CI. (Your current turbo.json has `^build` on both; drop it unless a package starts emitting `.d.ts`.)
- `outputs: [".next/**", "!.next/cache/**"]` is the Vercel-recommended Next.js value. Keep `!.next/cache/**` or you poison the cache.

### Does Vercel use turbo.json?

Yes, two ways:

1. **Build-time:** When a project's Build Command runs `turbo run build`, Turbo reads `turbo.json` (task graph, env hashing, outputs) and — on Vercel — automatically scopes to the project's Root Directory app via [automatic workspace scoping](https://turborepo.dev). `turbo` is available **globally** on Vercel, so you do **not** need it in each app's deps (it's in root `devDependencies`, which is enough).
2. **Skip decisions:** Vercel's "Skip unaffected projects" (see §2/§3) reads the workspace graph from your lockfile + `package.json` `workspaces` + each package's `dependencies`. `turbo query affected` (used in the Ignored Build Step) reads `turbo.json` `inputs`/task graph for precise change detection.

---

## 2. Vercel project settings (per project)

Create **two** projects from the **same** GitHub repo. The only field that differs between them is **Root Directory**.

### Critical: how Vercel handles the root lockfile with workspaces

When Root Directory = `apps/marketing` (a subdir) **and** the repo root has `package.json` with `"workspaces"` + a single `package-lock.json`:

- Vercel **detects the npm workspace from the repo root** and runs the install **from the repository root**, using the **root `package-lock.json`**. It does **not** try to install only inside `apps/marketing`.
- You do **NOT** need to write `npm ci` yourself, and you should **not** hardcode `installCommand: "npm ci"` scoped to the subdir. Let Vercel auto-detect the install. Auto-detect runs the workspace-aware install (`npm install`/`npm ci` at root) so `@xc/*` symlinks and hoisted deps resolve correctly.
- The "**Include source files outside of the Root Directory in the Build Step**" option must be **ON** so the build can read `../../packages/*` and `../../package-lock.json`. It is **enabled by default** for all projects created after Aug 2020 — verify it's on.

> Pitfall to avoid: a literal `installCommand: "npm ci"` with Root Directory at the subdir can run in a context that ignores workspace hoisting and fail to link `@xc/*`. Remove it and let Vercel auto-detect (the §3 `vercel.json` below drops it).

### Exact dashboard values

| Setting | **xcreativs-marketing** | **xcreativs-portal** |
|---|---|---|
| **Root Directory** | `apps/marketing` | `apps/portal` |
| Include source files outside Root Directory | **ON** (default) | **ON** (default) |
| **Framework Preset** | Next.js | Next.js |
| **Install Command** | *(leave default / auto)* — Vercel runs workspace-aware install from repo root using `package-lock.json` | *(leave default / auto)* |
| **Build Command** | `turbo run build` *(or leave Next.js default `next build`)* | `turbo run build` *(or default `next build`)* |
| **Output Directory** | *(default)* — `.next` | *(default)* — `.next` |
| **Node.js Version** | 22.x | 22.x |
| Root Directory → **Skip deployment** (skip unaffected) | **Enabled** | **Enabled** |

Recommendation: set **Build Command = `turbo run build`** (not bare `next build`). With global `turbo` + automatic workspace scoping, Turbo builds `@xc/*` deps in graph order and gives you remote-cache hits. The Output Directory stays `.next` (Turbo writes into the app's `.next`, which Vercel reads relative to Root Directory).

> "Skip deployment" (the **Skip unaffected projects** toggle in Root Directory settings) is the preferred skip mechanism on Vercel: it does **not** consume a concurrent build slot. The Ignored Build Step in §3 (`turbo-ignore`) **does** consume a slot for the canceled build. Enable both for belt-and-suspenders; "Skip deployment" wins when it applies (GitHub-connected repos only).

---

## 3. vercel.json to commit (per app)

Replace the current `apps/marketing/vercel.json` and `apps/portal/vercel.json` (which hardcode `npm ci` / `next build`) with the versions below. Key changes: drop `installCommand` (let Vercel auto-detect the workspace install), set `buildCommand` to Turbo, and add the **Ignored Build Step** via `ignoreCommand`.

### `apps/marketing/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "turbo run build",
  "ignoreCommand": "npx turbo-ignore marketing --fallback=HEAD^1"
}
```

### `apps/portal/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "turbo run build",
  "ignoreCommand": "npx turbo-ignore portal --fallback=HEAD^1"
}
```

How `ignoreCommand` works: Vercel runs it before building. **Exit 0 = skip the build**, **exit non-zero = proceed**. `turbo-ignore <workspace>` exits 0 (skip) when neither the named workspace **nor any of its internal package dependencies** (`@xc/ui`/`@xc/api`/`@xc/i18n`, traced via `package.json` deps + `turbo.json` graph) changed since the comparison commit; otherwise it builds. The positional arg is the **workspace name** (`marketing` / `portal`), not the directory. `--fallback=HEAD^1` tells it what to diff against when Vercel can't infer a previous successful deploy (e.g. first deploy, shallow clone) — without it the first build may be wrongly skipped.

> **2026 note — `turbo-ignore` is deprecated.** It still works and is still the value Vercel's dashboard auto-fills, so it's safe to ship. The modern replacement is `turbo query affected`. If/when you want to migrate, use this `ignoreCommand` instead (same exit-code contract — exit 1 = affected = build, exit 0 = skip):
>
> ```jsonc
> // marketing
> "ignoreCommand": "turbo query affected --packages marketing --exit-code --base $VERCEL_GIT_PREVIOUS_SHA || npx turbo-ignore marketing --fallback=HEAD^1"
> ```
>
> `turbo query affected` is more precise because it honors each task's `inputs` (e.g. a docs `.md` change won't trigger a rebuild). The `|| turbo-ignore` keeps a fallback for the first deploy. For most teams, sticking with `npx turbo-ignore` is fine — don't over-engineer this.

> If you rely solely on the Root Directory **Skip deployment** toggle (§2), you can omit `ignoreCommand` entirely. Keeping it adds a second layer and works even on the rare path the platform skip doesn't catch.

---

## 4. Environment variable matrix

Set these in **Project Settings → Environment Variables** for each project. Apply each to **Production** and **Preview** (and Development if you use `vercel dev`).

**Legend:**
- `NEXT_PUBLIC_*` = **build-time inlined** into the client bundle. Changing it requires a **redeploy**. Never put secrets here.
- *(server)* = server-only; available to SSR / rewrites / route handlers. Not shipped to the browser.

### Project: xcreativs-marketing

| Key | Type | Production value | Preview value |
|---|---|---|---|
| `API_PROXY_URL` | server | `https://xcreativs-api.onrender.com` | `https://xcreativs-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | public (inlined) | `https://xcreativs.com` | *(preview deploy URL or)* `https://xcreativs.com` |
| `NEXT_PUBLIC_PORTAL_URL` | public (inlined) | `https://portal.xcreativs.com` | `https://portal.xcreativs.com` |
| `NEXT_TELEMETRY_DISABLED` | server | `1` | `1` |

### Project: xcreativs-portal

| Key | Type | Production value | Preview value |
|---|---|---|---|
| `API_PROXY_URL` | server | `https://xcreativs-api.onrender.com` | `https://xcreativs-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | public (inlined) | `https://portal.xcreativs.com` | *(preview deploy URL or)* `https://portal.xcreativs.com` |
| `NEXT_PUBLIC_SITE_URL` | public (inlined) | `https://xcreativs.com` | `https://xcreativs.com` |
| `NEXT_TELEMETRY_DISABLED` | server | `1` | `1` |

Notes:
- **`NEXT_PUBLIC_PORTAL_URL` is intentionally NOT set on portal** — portal uses a relative `/login`, so leaving it unset is correct. Setting it would make portal redirect to an absolute origin needlessly.
- **`NEXT_PUBLIC_API_URL` is the app's own public origin** (used by `api.ts` only during SSR via `typeof window === "undefined"`, and for absolute-URL construction). It is **not** the Render URL. The Render URL goes only in `API_PROXY_URL`. Keeping them separate is what makes the browser stay same-origin.
- Because `API_PROXY_URL` and `NEXT_PUBLIC_*` are listed in `turbo.json` `build.env`, changing any of them produces a correct cache miss and rebuild.
- Setting them via CLI (optional):
  ```bash
  # from repo root, after `vercel link --repo`
  printf 'https://xcreativs-api.onrender.com' | vercel env add API_PROXY_URL production --cwd apps/marketing
  printf 'https://xcreativs-api.onrender.com' | vercel env add API_PROXY_URL preview    --cwd apps/marketing
  # ...repeat per key/env/app
  ```

---

## 5. Domains & DNS

Attach domains in each project's **Settings → Domains**.

| Domain | Vercel project | Role |
|---|---|---|
| `xcreativs.com` (apex) | xcreativs-marketing | primary |
| `www.xcreativs.com` | xcreativs-marketing | redirect → apex (or apex → www; pick one canonical) |
| `portal.xcreativs.com` | xcreativs-portal | primary |

In the marketing project, add **both** `xcreativs.com` and `www.xcreativs.com`; Vercel will offer to **redirect `www` → apex** (recommended). Set the apex as the canonical/production domain.

### DNS records at your registrar

```
# Apex → marketing (A record; apex can't be a CNAME)
xcreativs.com.            A      76.76.21.21

# www → marketing
www.xcreativs.com.        CNAME  cname.vercel-dns.com.

# portal subdomain → portal project
portal.xcreativs.com.     CNAME  cname.vercel-dns.com.
```

- If your DNS provider supports **CNAME flattening / ALIAS** at the apex (e.g. Cloudflare, DNSimple), you may use `ALIAS xcreativs.com → cname.vercel-dns.com` instead of the A record. Otherwise use the `A 76.76.21.21` record shown (Vercel verifies the current target in the dashboard — use whatever value the Domains tab displays for your account).
- SSL: certificates auto-provision once DNS resolves to Vercel (usually < 10 min). If you keep DNS on an external provider, add a CAA record permitting `letsencrypt.org` if you have CAA records at all.
- Verify each domain shows **"Valid Configuration"** in its project's Domains tab before flipping traffic.

---

## 6. Render backend (Go / chi)

Your `render.yaml` already defines `xcreativs-api` (Docker), Postgres, Redis, and leaves `ALLOWED_ORIGINS` + `BASE_URL` as `sync: false` (set after the Vercel domains exist).

### `ALLOWED_ORIGINS` — exact value

Set in Render → `xcreativs-api` → Environment (comma-separated, **no spaces**, no trailing slashes, no `*`, no localhost — your `config.go` rejects those when `ENV=production`):

```
ALLOWED_ORIGINS=https://xcreativs.com,https://www.xcreativs.com,https://portal.xcreativs.com
```

Also set:

```
BASE_URL=https://xcreativs-api.onrender.com
```

### Is CORS even needed here?

**For normal app traffic: no.** The browser calls relative `/api/...`, which Vercel's rewrite proxies **server-side** to Render. The browser's origin is the Vercel deployment; it never makes a cross-origin request to `onrender.com`, so no preflight, no `Access-Control-Allow-Origin` check. You could technically run the backend with no CORS and the app would still work end-to-end.

**Why you still set `ALLOWED_ORIGINS` to the 3 prod origins:**
- **Defense in depth / direct callers.** Anything that hits Render **cross-origin directly** from a browser **would** be subject to CORS: the `/docs` Swagger UI "Try it out", the `/api/v1/...` surface called from a different origin, future browser clients, or a misconfigured client that uses an absolute Render URL instead of the relative path. For those, CORS must allow the real origins.
- **Your config refuses to boot insecurely.** `config.go` rejects `*`/localhost when `ENV=production`, so you must provide explicit origins anyway — make them the real three.

> `API_PROXY_URL` on Vercel must point at the Render **service URL** (`https://xcreativs-api.onrender.com`), not a custom API domain, unless/until you map one. If you later add `api.xcreativs.com` → Render, update `API_PROXY_URL` on both Vercel projects to that and add it to `ALLOWED_ORIGINS` too.

---

## 7. First deploy + verification

### A. Commit config

```bash
cd "/Users/shayford/Desktop/Desktop - Stanley Hayford - 1/Dev/TS/xcreatives"
git checkout -b chore/vercel-deploy-config
# (apply the §1 turbo.json schema/url change and the §3 vercel.json files)
git add turbo.json apps/marketing/vercel.json apps/portal/vercel.json docs/DEPLOY.md
git commit -m "chore: vercel two-project monorepo deploy config"
git push -u origin chore/vercel-deploy-config   # then merge to main
```

### B. Import the two projects (dashboard)

1. **Add New → Project →** import the `xcreativs` repo. Set **Root Directory = `apps/marketing`**, Framework **Next.js**, Node **22.x**. Add env vars from §4 (marketing). Deploy.
2. **Add New → Project →** import the **same** repo again. Set **Root Directory = `apps/portal`**. Add env vars from §4 (portal). Deploy.
3. In each project: Settings → Build & Deployment → Root Directory → enable **Skip deployment** (skip unaffected).

   CLI alternative for env-only management later:
   ```bash
   npm i -g vercel && vercel login
   vercel link --repo            # run from repo root; links both projects
   ```

### C. Set Render env + redeploy backend

Set `ALLOWED_ORIGINS` and `BASE_URL` (§6) in Render, then redeploy `xcreativs-api`. Run migrations once (per `render.yaml` header):
```bash
DB_URL=<render external connection string> make -C backend migrate-up
```

### D. Verify (production)

```bash
# 1. /api proxy works (same-origin → Render). Should be 200, NOT 502/localhost.
curl -i https://xcreativs.com/api/v1/health   # or your real health route under /api
curl -i https://portal.xcreativs.com/api/v1/health

# 2. Backend healthy directly
curl -i https://xcreativs-api.onrender.com/healthz

# 3. Security headers present (set by next.config)
curl -sI https://xcreativs.com/ | grep -i -E 'x-frame-options|strict-transport-security|x-content-type-options'
```

4. **Login on portal:** open `https://portal.xcreativs.com/login`, sign in. Confirm the auth call goes to `portal.xcreativs.com/api/...` in DevTools Network (same-origin, no CORS error), and that a 401 redirects to the relative `/login` (not an absolute portal URL).
5. **Role gate:** confirm `/portal/admin` is blocked for non-admin sessions.
6. **hreflang / i18n:** locales are `en` + `fr`, `localePrefix: "as-needed"`, so `en` is unprefixed and `fr` is at `/fr`.
   ```bash
   curl -s https://xcreativs.com/        | grep -i 'hreflang'   # expect en (x-default) + fr alternates
   curl -sI https://xcreativs.com/fr     # 200, French variant
   curl -sI https://xcreativs.com/en     # typically 308 → /  (as-needed strips default prefix)
   ```
7. **Skip-unaffected sanity:** push a commit touching **only** `apps/portal`. Confirm the **marketing** deployment is skipped (Vercel shows "Skipped" / canceled by ignore step) while **portal** builds.

---

## 8. Gotchas specific to this setup

1. **`transpilePackages` + raw TSX.** `@xc/api`/`@xc/i18n`/`@xc/ui` ship raw `.tsx` and are compiled by each app's Next build via `transpilePackages`. This works on Vercel **only** because the install runs from the repo root (workspace symlinks resolve) and "Include source files outside Root Directory" is ON. If a build errors with `Module not found: @xc/ui`, the cause is almost always a non-workspace-aware install — remove any hardcoded `installCommand` and let Vercel auto-detect.

2. **next-intl plugin relative path.** Both configs call `createNextIntlPlugin("../../packages/i18n/src/request.ts")`. That `../../` reaches **outside** the Root Directory into `packages/i18n`. It only resolves because outside-root source inclusion is enabled. Don't "fix" the path to be app-local — it's correct as a monorepo-relative path. If it breaks, the toggle is off, not the path.

3. **Monorepo lockfile.** There is exactly **one** `package-lock.json` at the repo root. Vercel installs from root using it for **both** projects. Never add per-app lockfiles — that fragments the workspace and breaks `@xc/*` hoisting. After any dependency change, run `npm install` at the **root** and commit the single root lockfile. A lockfile-only change that affects just one app's deps will (correctly) skip the other app's build.

4. **turbo-ignore + shared package changes.** `npx turbo-ignore marketing` builds marketing when `marketing` **or** any of `@xc/ui`/`@xc/api`/`@xc/i18n` changes — because the dependency graph is traced from `package.json`. So a change to `@xc/ui` correctly rebuilds **both** apps (no stale shared code). This relies on each app declaring `@xc/*` in its `dependencies` (it does). If you ever consume a shared package without listing it in `dependencies`, turbo-ignore won't see the edge and may wrongly skip — always declare internal deps explicitly.

5. **`API_PROXY_URL` must be present in the build env, not just runtime.** The rewrite destination is read in `next.config.mjs` at **build time**. It's declared in `turbo.json` `build.env`, so a value change busts the cache. If you change it in the Vercel dashboard, you must **redeploy** — editing the var alone won't rebuild.

6. **`NEXT_PUBLIC_*` are baked at build.** Changing `NEXT_PUBLIC_PORTAL_URL` (marketing) or `NEXT_PUBLIC_SITE_URL` (portal) requires a redeploy of that project; the old value is compiled into the served JS until then.

7. **`turbo.json` schema/host migration.** Older `turbo.json` files point `$schema` at `https://turbo.build/schema.json` (now redirects to `turborepo.dev`). Update to `https://turborepo.dev/schema.json` to match turbo 2.9.x and avoid editor schema warnings. The `tasks` key (not `pipeline`) is required on 2.x.

8. **Don't disable deployment protection to test previews.** Preview URLs may require Vercel login (Deployment Protection). To curl a protected preview, use `vercel curl <preview-url>/api/...` rather than turning protection off.
