"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft, CheckCircle, Users } from "lucide-react";
import CustomSelect from "@xc/ui/CustomSelect";

const SENIORITY_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Principal" },
  { value: "executive", label: "Executive" },
];

export default function TalentNetworkPage() {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    domains: "",
    seniority_level: "senior",
    linkedin_url: "",
    portfolio_url: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.joinTalentNetwork({
        ...form,
        domains: form.domains
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join the talent network. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="shell-x flex min-h-[80vh] items-center justify-center py-20">
        <div className="panel-x max-w-lg p-8 text-center lg:p-10">
          <CheckCircle className="mx-auto mb-5 h-12 w-12 text-signal" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">You are on the list</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gravity/60">
            Thank you for joining the talent network. We will reach out when a role that fits your domains opens.
          </p>
          <Link href="/careers" className="btn-x-secondary mt-7">
            Back to careers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell-x py-20">
      <Link href="/careers" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
        <ArrowLeft className="w-4 h-4" /> All Roles
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="panel-x max-w-xl p-6 lg:p-8">
          <p className="context-label-x mb-4">Talent network</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">Talent Network</h1>
          <p className="mt-4 text-gravity/60">
            No open role fits today, but you want to be known to us? Tell us your domains and we will notify you when a
            fitting role opens.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email *"
              className="field-x"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="First name"
                className="field-x"
              />
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Last name"
                className="field-x"
              />
            </div>
            <input
              value={form.domains}
              onChange={(e) => setForm({ ...form, domains: e.target.value })}
              placeholder="Domains of expertise (comma-separated)"
              className="field-x"
            />
            <CustomSelect
              value={form.seniority_level}
              onChange={(value) => setForm({ ...form, seniority_level: value })}
              options={SENIORITY_OPTIONS}
            />
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="LinkedIn URL"
              className="field-x"
            />
            <input
              type="url"
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              placeholder="Portfolio URL"
              className="field-x"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about the systems you have worked on."
              className="field-x h-28"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-x disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Join the Network"}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="panel-x-soft p-6 lg:p-8">
            <Users className="w-6 h-6 text-signal mb-3" />
            <h2 className="text-lg font-semibold mb-2">Why join</h2>
            <ul className="space-y-2 text-gravity/60 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> First look at roles before they are
                posted
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Matched to your domains, not a generic
                pipeline
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Work on national-scale systems with
                serious teams
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
