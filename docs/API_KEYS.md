# API Keys & Secrets to Provide

Every external credential the platform reads, where to get it, and what it unlocks.
Nothing here is committed — set them as **Render** env vars (backend) and **Vercel** env vars (frontend),
or in `backend/.env` for local dev.

Legend: ✅ required · ⚙️ optional (feature degrades gracefully if unset) · 🚩 flag (not a secret)

---

## 1. Required — the backend will not boot in production without these

| Variable | What / where to get it |
|---|---|
| ✅ `ENV` | `production` |
| ✅ `DB_URL` | Postgres connection string. Auto-provided by the Render Blueprint (`render.yaml`). Must **not** contain `sslmode=disable` in prod. |
| ✅ `JWT_SECRET` | Random ≥32 chars. `openssl rand -base64 48`. (Render can auto-generate.) |
| ✅ `JWT_REFRESH_SECRET` | A **different** random ≥32 chars. `openssl rand -base64 48`. |
| ✅ `BASE_URL` | Public frontend URL, e.g. `https://app.xcreativs.com` (used for SSO redirects, invoice/payment links, RSS, assessment links). |
| ✅ `ALLOWED_ORIGINS` | Comma-separated allowed browser origins, e.g. `https://app.xcreativs.com`. No `*`, no `localhost` in prod. |

> The app **fails fast at startup** if any of these are weak/missing in production.

---

## 2. Email — Resend (required for notifications)

| Variable | What / where to get it |
|---|---|
| ✅ `RESEND_API_KEY` | From the [Resend dashboard](https://resend.com) → API Keys (`re_…`). |
| ✅ `EMAIL_FROM_ADDRESS` | A sender on a **domain you verified in Resend** (e.g. `noreply@xcreativs.com`). |
| ⚙️ `EMAIL_FROM_NAME` | Display name, default `XCreativs`. |

> **Action:** in Resend, verify your sending domain (add the DKIM/SPF DNS records) before mail will deliver.
> Drives: diagnostic/RFP/booking confirmations, applicant status + interview + assessment emails,
> password-reset / email-verification, notification digests, and segmented broadcasts.

---

## 3. Optional integrations — each feature lights up only when its keys are set

### AI Concierge (generative answers)
| Variable | Notes |
|---|---|
| ⚙️ `ANTHROPIC_API_KEY` | From the [Anthropic Console](https://console.anthropic.com). Without it the concierge still works (extractive retrieval + citations); with it, answers are generated and grounded. |
| ⚙️ `ANTHROPIC_MODEL` | Default `claude-haiku-4-5-20251001`. |

### Payments (invoice payment links)
| Variable | Notes |
|---|---|
| ⚙️ `PAYSTACK_SECRET_KEY` | From [Paystack dashboard](https://dashboard.paystack.com) → Settings → API Keys (`sk_…`). The **wired** gateway: real hosted payment links. |
| ⚙️ `STRIPE_SECRET_KEY` | From [Stripe dashboard](https://dashboard.stripe.com/apikeys) (`sk_…`). Reserved — Stripe currently falls back to an internal link; Paystack is the live integration. |

> Without a gateway key, invoices still generate and return an internal `BASE_URL/pay/<invoice>` link.

### SMS / WhatsApp notifications — Twilio
| Variable | Notes |
|---|---|
| ⚙️ `TWILIO_ACCOUNT_SID` | [Twilio console](https://console.twilio.com) (`AC…`). |
| ⚙️ `TWILIO_AUTH_TOKEN` | Twilio console. |
| ⚙️ `TWILIO_FROM` | Your Twilio SMS number (E.164, e.g. `+1…`). |
| ⚙️ `TWILIO_WHATSAPP_FROM` | Your WhatsApp-enabled sender (e.g. `whatsapp:+…` number / sandbox). |

> Without these, the SMS/WhatsApp channels are silent no-ops; email + in-app still work.

### Audio-brief TTS
| Variable | Notes |
|---|---|
| ⚙️ `TTS_API_URL` | OpenAI-compatible base URL exposing `/audio/speech` (e.g. `https://api.openai.com/v1`). |
| ⚙️ `TTS_API_KEY` | The provider key. |
| ⚙️ `TTS_MODEL` | Default `tts-1`. |
| ⚙️ `TTS_VOICE` | Default `alloy`. |

> Without these, `POST /admin/audio-briefs/{slug}/generate-tts` returns `501 not configured`.

### Social SSO — Google & Microsoft
| Variable | Where |
|---|---|
| ⚙️ `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client. Redirect URI: `https://<api-domain>/api/v1/auth/oauth/google/callback`. |
| ⚙️ `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET` | [Azure Portal](https://portal.azure.com) → App registrations. Redirect URI: `…/auth/oauth/microsoft/callback`. |

> Unset → `/auth/oauth/{provider}/login` returns `501`.

### Enterprise SSO — generic OIDC (Okta / Azure AD / Auth0 / Keycloak)
| Variable | Notes |
|---|---|
| ⚙️ `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | From your IdP's app/client. |
| ⚙️ `OIDC_AUTH_URL` / `OIDC_TOKEN_URL` / `OIDC_USERINFO_URL` | The IdP's authorize / token / userinfo endpoints (from its `.well-known/openid-configuration`). |
| ⚙️ `OIDC_SCOPE` | Default `openid email profile`. |

> Redirect URI to register: `https://<api-domain>/api/v1/auth/oauth/oidc/callback`.

### Media / file uploads — Cloudinary
| Variable | Notes |
|---|---|
| ⚙️ `CLOUDINARY_CLOUD_NAME` | From the [Cloudinary dashboard](https://console.cloudinary.com) (Product Environment / cloud name). |
| ⚙️ `CLOUDINARY_API_KEY` | Cloudinary dashboard → API Keys. |
| ⚙️ `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API Keys. |

> Powers `POST /api/v1/uploads` (résumés, deliverables, media) and stores **generated TTS audio**.
> Unset → `/uploads` returns `501`, and TTS streams the audio back for manual hosting instead of uploading.

### Cache / sessions
| Variable | Notes |
|---|---|
| ⚙️ `REDIS_URL` | Auto-provided by the Render Blueprint. Used for rate limiting / caching. |

### Policy flag
| Variable | Notes |
|---|---|
| 🚩 `MFA_REQUIRED` | `true` to block authenticated users until they enrol MFA (recommended in prod). Not a secret. |

---

## 4. Frontend (Vercel)

| Variable | What / where |
|---|---|
| ✅ `NEXT_PUBLIC_API_URL` | The Render API URL, e.g. `https://xcreativs-api.onrender.com` (used by the browser + SSO/feed links). |
| ✅ `API_PROXY_URL` | Same Render API URL (server-side `/api/*` proxy target). |

---

## 5. Quick-start checklist

- [ ] `openssl rand -base64 48` → `JWT_SECRET`; again → `JWT_REFRESH_SECRET`
- [ ] Render Blueprint provisions `DB_URL` + `REDIS_URL` automatically
- [ ] Set `ENV=production`, `BASE_URL`, `ALLOWED_ORIGINS`, `MFA_REQUIRED=true` on Render
- [ ] Resend: verify domain → set `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`
- [ ] Vercel: set `NEXT_PUBLIC_API_URL`, `API_PROXY_URL` to the Render API URL
- [ ] (Optional, as needed) `ANTHROPIC_API_KEY`, `PAYSTACK_SECRET_KEY`, `TWILIO_*`, `TTS_*`, OAuth/OIDC, `CLOUDINARY_*`

Everything optional can be added later with **zero code changes** — the matching feature simply activates.
