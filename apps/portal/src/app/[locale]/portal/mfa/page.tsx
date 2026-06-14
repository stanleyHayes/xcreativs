"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@xc/api";
import { ArrowRight, CheckCircle, Copy, KeyRound, LockKeyhole, Shield, ShieldCheck, Smartphone } from "lucide-react";
import type { AuthUser, MFAEnrollmentResponse } from "@xc/api/types";

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function MFAPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [enrollment, setEnrollment] = useState<MFAEnrollmentResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.enrollMFA();
      setEnrollment(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll MFA");
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setLoading(true);
    setError("");
    try {
      await api.verifyMFA({ secret: enrollment.secret, code });
      setSuccess("MFA enabled successfully. You will be required to enter a code on next login.");
      setEnrollment(null);
      setCode("");
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as AuthUser;
        u.mfa_enabled = true;
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <Shield className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Security</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Two-factor authentication
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Protect portal access with a time-based authenticator code in addition to your password.
            </p>
          </div>

          <div className="portal-card-x p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Current status</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">
                  {user?.mfa_enabled ? "Protected" : enrollment ? "Enrollment in progress" : "Not enabled"}
                </h2>
              </div>
              {user?.mfa_enabled ? (
                <ShieldCheck className="h-5 w-5 text-green-300" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-signal" />
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {user?.mfa_enabled
                ? "Your account requires an authenticator code at sign-in."
                : "Enroll an authenticator app to harden account access."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="portal-panel-x p-5 sm:p-6 lg:p-8">
          {user?.mfa_enabled ? (
            <div className="rounded-lg border border-green-400/20 bg-green-400/10 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-green-400/30 bg-green-400/10 text-green-300">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-green-200">MFA is enabled</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
                    Your account is protected with two-factor authentication. Keep your authenticator app available for future portal sign-ins.
                  </p>
                  <Link href={`/${locale}/portal/settings`} className="portal-btn-secondary-x mt-5">
                    Back to settings
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : !enrollment ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-center">
              <div>
                <p className="portal-meta-x">Enrollment</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">Add an authenticator app</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/58">
                  Generate a secret, scan the QR code in your preferred authenticator app, then confirm the six-digit code.
                </p>
                {success && <p className="mt-4 text-sm text-signal">{success}</p>}
                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                <button
                  onClick={handleEnroll}
                  disabled={loading}
                  className="portal-btn-x mt-6 disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  {loading ? "Generating..." : "Start enrollment"}
                </button>
              </div>
              <div className="portal-card-x p-5">
                <p className="portal-meta-x">What changes</p>
                <div className="mt-4 space-y-4">
                  {[
                    { icon: Smartphone, title: "Authenticator app", text: "Use a trusted TOTP app on your phone or password manager." },
                    { icon: KeyRound, title: "One-time codes", text: "Enter a fresh six-digit code when the portal asks for verification." },
                    { icon: ShieldCheck, title: "Safer sessions", text: "Password compromise alone will not be enough to access the portal." },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-white/45">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="portal-meta-x">Enrollment in progress</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">Connect your authenticator</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/58">
                  Scan the QR code, save the secret somewhere secure, then enter the generated six-digit code.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="portal-card-x p-5">
                  <p className="portal-meta-x text-signal">Step 1</p>
                  <h3 className="mt-2 font-semibold">Scan QR code</h3>
                  <div className="mt-4 flex justify-center rounded-lg border border-white/10 bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollment.qr_url ?? "")}`}
                      alt="MFA QR Code"
                      className="h-48 w-48"
                    />
                  </div>
                </div>

                <div className="portal-card-x p-5">
                  <p className="portal-meta-x text-signal">Step 2</p>
                  <h3 className="mt-2 font-semibold">Store manual secret</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">
                    Use this if your app cannot scan the QR code.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-3">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm text-signal">{enrollment.secret}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(enrollment.secret ?? "")}
                      className="portal-admin-action-x"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="portal-card-x space-y-4 p-5">
                <div>
                  <p className="portal-meta-x text-signal">Step 3</p>
                  <label className="mt-2 block text-sm font-semibold text-white/78">
                    Enter the 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="portal-field-x mt-3 max-w-xs text-center font-mono text-lg tracking-[0.25em]"
                    placeholder="000000"
                  />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                {success && <p className="text-sm text-signal">{success}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="portal-btn-x disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify and enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEnrollment(null); setCode(""); setError(""); }}
                    className="portal-btn-secondary-x"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="portal-card-x p-5">
            <p className="portal-meta-x">Security checklist</p>
            <div className="mt-4 space-y-4">
              {[
                { title: "Profile email", done: Boolean(user?.email), text: user?.email || "No email stored locally" },
                { title: "Two-factor auth", done: Boolean(user?.mfa_enabled), text: user?.mfa_enabled ? "Enabled" : "Not enabled yet" },
                { title: "Session hygiene", done: true, text: "Sign out from shared devices after portal work." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${item.done ? "border-signal/30 bg-signal/10 text-signal" : "border-white/12 bg-white/5 text-white/32"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/46">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-card-x p-5">
            <p className="portal-meta-x">Need to update profile?</p>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Keep your profile email current so account recovery and security notices reach the right inbox.
            </p>
            <Link href={`/${locale}/portal/settings`} className="portal-btn-secondary-x mt-5">
              Open settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
