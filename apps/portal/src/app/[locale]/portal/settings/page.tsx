"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@xc/api";
import { ArrowRight, CheckCircle, KeyRound, Mail, Save, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import type { AuthUser } from "@xc/api/types";

function getStoredUser(): AuthUser | null {
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

export default function SettingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [firstName, setFirstName] = useState(() => getStoredUser()?.first_name || "");
  const [lastName, setLastName] = useState(() => getStoredUser()?.last_name || "");
  const [email, setEmail] = useState(() => getStoredUser()?.email || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const updated = (await api.updateProfile({ first_name: firstName, last_name: lastName, email })) as AuthUser;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
    setLoading(false);
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || "XC";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Portal user";
  const profileFields = [firstName, lastName, email].filter(Boolean).length;
  const profileCompletion = Math.round((profileFields / 3) * 100);
  const accountLinks = [
    {
      href: `/${locale}/portal/mfa`,
      icon: ShieldCheck,
      label: "Security",
      text: user?.mfa_enabled ? "Two-factor authentication is enabled." : "Enable two-factor authentication.",
    },
    {
      href: `/${locale}/portal/preferences`,
      icon: SlidersHorizontal,
      label: "Preferences",
      text: "Tune portal currency, notifications, and workspace defaults.",
    },
    {
      href: `/${locale}/portal/api-keys`,
      icon: KeyRound,
      label: "API keys",
      text: "Manage integration credentials and programmatic access.",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <UserRound className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Account controls</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Settings
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Keep your identity, access posture, and workspace preferences aligned with how you use the portal.
            </p>
          </div>

          <div className="portal-card-x p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-xl font-semibold text-signal">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="portal-meta-x">Signed in as</p>
                <p className="mt-1 truncate text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-white/45">{user?.role || "workspace member"}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/42">
                <span>Profile completion</span>
                <span>{profileCompletion}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-signal" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="portal-panel-x p-5 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="portal-meta-x">Profile</p>
              <h2 className="font-display mt-1 text-2xl font-semibold">Identity details</h2>
            </div>
            {saved && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-sm text-signal">
                <CheckCircle className="h-4 w-4" />
                Saved
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/76">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="portal-field-x w-full"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/76">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="portal-field-x w-full"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/76">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="portal-field-x portal-field-icon-x"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="portal-btn-x disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="portal-card-x p-5">
            <p className="portal-meta-x">Access posture</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">
              {user?.mfa_enabled ? "Protected account" : "Basic protection"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/52">
              {user?.mfa_enabled
                ? "Two-factor authentication is active for this account."
                : "Add an authenticator code requirement to reduce account risk."}
            </p>
            <Link href={`/${locale}/portal/mfa`} className="portal-btn-secondary-x mt-5">
              Open security
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {accountLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="portal-card-x group block p-4 hover:border-signal/45">
                <div className="flex items-start gap-3">
                  <span className="portal-admin-icon-x h-9 w-9">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{item.label}</p>
                      <ArrowRight className="h-4 w-4 text-white/24 transition-colors group-hover:text-signal" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white/48">{item.text}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
