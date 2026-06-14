"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { api } from "@xc/api";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_URL = ""; // relative -> same-origin /api proxy
const MFA_HELP_TEXT = "Enter the 6-digit code from your authenticator app.";
const INPUT_CLASS =
  "portal-field-x portal-login-input-x text-sm placeholder:text-white/30 disabled:opacity-50";
const SSO_BUTTON_CLASS =
  "group flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-signal/50 hover:bg-signal/10 hover:text-white";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [hideSsoError, setHideSsoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "en";
  const ssoError = searchParams.get("sso_error");
  const visibleError = error || (!hideSsoError && ssoError ? `Single sign-on failed: ${ssoError}` : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHideSsoError(true);
    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = { email, password };
    if (mfaRequired && mfaCode) {
      payload.mfa_code = mfaCode;
    }

    try {
      const res = await api.login(payload);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push(`/${locale}/portal`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg === "mfa_required") {
        setMfaRequired(true);
        setError(MFA_HELP_TEXT);
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  }

  return (
    <main className="portal-shell-x relative isolate overflow-hidden bg-gravity text-foundation">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.045]" />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -right-[16rem] top-[-14rem] h-[38rem] w-[38rem] rounded-full bg-signal/25 blur-[140px]"
      />
      <div
        aria-hidden
        className="animate-drift-slow pointer-events-none absolute -left-[14rem] bottom-[-16rem] h-[34rem] w-[34rem] rounded-full bg-signal/10 blur-[130px]"
      />
      <div aria-hidden className="rule-x absolute inset-x-0 top-0 h-px opacity-40" />

      <div className="shell-x relative grid min-h-[calc(100vh-72px)] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/55 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            Secure client access
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Image src="/logo.svg" alt="XCreativs" width={48} height={48} className="h-12 w-12" priority />
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight">XCreativs Portal</p>
              <p className="text-sm text-white/45">Authenticated workspace for active engagements</p>
            </div>
          </div>

          <h1 className="font-display mt-10 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-tight lg:text-6xl">
            Sign in to the work behind the work.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 lg:text-lg">
            Access engagement dashboards, decisions, deliverables, invoices, and partner activity from a protected workspace built for serious operational work.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "MFA ready", text: "Authenticator support" },
              { icon: LockKeyhole, label: "Scoped access", text: "Role-aware portal" },
              { icon: Sparkles, label: "Live context", text: "Engagement signals" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="portal-card-x p-4">
                  <Icon className="h-5 w-5 text-signal" />
                  <p className="mt-3 text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs text-white/40">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="portal-card-x overflow-hidden border-white/15 bg-white/[0.035] p-2 backdrop-blur-2xl">
            <div className="rounded-lg border border-white/10 bg-gravity/80 p-5 shadow-2xl sm:p-6 lg:p-7">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">
                  Portal sign in
                </p>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
                  Welcome back.
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Use your workspace credentials or continue with your organisation provider.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/75">
                    <Mail className="h-4 w-4 text-signal" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={mfaRequired}
                    className={INPUT_CLASS}
                    placeholder="you@organisation.com"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/75">
                    <KeyRound className="h-4 w-4 text-signal" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={mfaRequired}
                      className={`${INPUT_CLASS} portal-login-input-x-with-action`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mfaRequired && (
                  <div className="rounded-2xl border border-signal/25 bg-signal/10 p-4">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                      <ShieldCheck className="h-4 w-4 text-signal" />
                      Authenticator Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      required
                      autoFocus
                      className={`${INPUT_CLASS} text-center font-mono text-lg tracking-[0.35em]`}
                      placeholder="000000"
                    />
                  </div>
                )}

                {visibleError && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      visibleError === MFA_HELP_TEXT
                        ? "border-signal/25 bg-signal/10 text-signal"
                        : "border-red-400/25 bg-red-400/10 text-red-200"
                    }`}
                  >
                    {visibleError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-signal/25 transition-transform hover:-translate-y-0.5 hover:bg-signal-ink disabled:translate-y-0 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : mfaRequired ? "Verify & Sign In" : "Sign In"}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>

                {mfaRequired && (
                  <button
                    type="button"
                    onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}
                    className="w-full text-sm text-white/50 transition-colors hover:text-white"
                  >
                    Back to email & password
                  </button>
                )}
              </form>

              <div className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                    or continue with
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a href={`${API_URL}/api/v1/auth/oauth/google/login`} className={SSO_BUTTON_CLASS}>
                    Google
                  </a>
                  <a href={`${API_URL}/api/v1/auth/oauth/microsoft/login`} className={SSO_BUTTON_CLASS}>
                    Microsoft
                  </a>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-xs leading-relaxed text-white/45">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                <p>
                  Access is provisioned per engagement. If your organisation uses SSO, choose your provider and we&apos;ll route you through the secure handshake.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginPageSkeleton() {
  return (
    <main className="portal-shell-x grid min-h-[calc(100vh-72px)] place-items-center bg-gravity text-foundation">
      <div className="portal-card-x w-full max-w-md p-6 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-signal/20" />
        <p className="mt-4 text-sm font-semibold text-white/70">Preparing secure sign in...</p>
      </div>
    </main>
  );
}
