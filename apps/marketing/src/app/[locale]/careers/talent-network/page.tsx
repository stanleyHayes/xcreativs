"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft, CheckCircle, Users } from "lucide-react";

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
      <main className="min-h-screen flex items-center justify-center bg-foundation">
        <div className="text-center px-6">
          <CheckCircle className="w-12 h-12 text-signal mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">You are on the list</h1>
          <p className="text-gravity/60 max-w-md mx-auto">
            Thank you for joining the talent network. We will reach out when a role that fits your domains opens.
          </p>
          <Link href="/careers" className="mt-6 inline-block text-signal font-medium hover:underline">
            Back to careers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Roles
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">§ 05 · Careers</p>
          <h1 className="text-3xl lg:text-5xl font-bold">Talent Network</h1>
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
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="First name"
                className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
              />
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Last name"
                className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
              />
            </div>
            <input
              value={form.domains}
              onChange={(e) => setForm({ ...form, domains: e.target.value })}
              placeholder="Domains of expertise (comma-separated)"
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
            />
            <select
              value={form.seniority_level}
              onChange={(e) => setForm({ ...form, seniority_level: e.target.value })}
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Principal</option>
              <option value="executive">Executive</option>
            </select>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="LinkedIn URL"
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
            />
            <input
              type="url"
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              placeholder="Portfolio URL"
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about the systems you have worked on."
              className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-28"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-signal text-white px-6 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Join the Network"}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="border border-hairline rounded p-6 bg-soft">
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
