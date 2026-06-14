"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Calendar, Clock, Users, Video, Radio, CheckCircle } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

interface Webinar {
  Slug: string;
  Title?: string;
  Description?: string;
  Status?: string;
  ScheduledAt: string;
  DurationMinutes?: number;
  SpeakerNames?: string[];
  RecordingURL?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  upcoming: { label: "Upcoming", color: "text-signal", bg: "bg-signal/10", icon: <Calendar className="w-3.5 h-3.5" /> },
  live: { label: "Live Now", color: "text-red-500", bg: "bg-red-500/10", icon: <Radio className="w-3.5 h-3.5" /> },
  recorded: { label: "Recorded", color: "text-green-600", bg: "bg-green-600/10", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-gravity/30", bg: "bg-gravity/5", icon: <Calendar className="w-3.5 h-3.5" /> },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    api.listWebinars(statusFilter).then((d) => {
      setWebinars((d.webinars as Webinar[] | undefined) || []);
      setLoading(false);
    });
  }, [statusFilter]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <PageBanner
        icon={Video}
        eyebrow="Live & recorded"
        title="Webinars"
        description="Live sessions and recorded briefings on platform economics, government digital readiness, and intelligent systems architecture."
        crumbs={[{ label: "Home", href: "/" }, { label: "Webinars" }]}
      />
      <main className="shell-x py-16">
        {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {["", "upcoming", "recorded"].map((s) => {
          const cfg = s ? statusConfig[s] : { label: "All", color: "", bg: "" };
          return (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "border-signal bg-signal text-white shadow-lg shadow-signal/15"
                  : "border-hairline bg-foundation text-gravity/60 hover:border-signal hover:text-signal"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="mt-12 space-y-6">
        {webinars.map((w) => {
          const cfg = (w.Status ? statusConfig[w.Status] : undefined) || statusConfig.upcoming;
          return (
            <div
              key={w.Slug}
              className="card-x p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <Link href={`/webinars/${w.Slug}`} className="group/title">
                    <h2 className="text-xl lg:text-2xl font-semibold group-hover/title:text-signal transition-colors">{w.Title}</h2>
                  </Link>
                  <p className="mt-2 text-gravity/60">{w.Description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gravity/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDate(w.ScheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {w.DurationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {w.SpeakerNames?.join(", ")}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {w.Status === "upcoming" && (
                    <RegisterButton slug={w.Slug} />
                  )}
                  {w.Status === "recorded" && w.RecordingURL && (
                    <a
                      href={w.RecordingURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-x"
                    >
                      <Video className="w-4 h-4" /> Watch Recording
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {webinars.length === 0 && (
        <p className="text-center text-gravity/40 py-12">No webinars found.</p>
      )}
      </main>
    </>
  );
}

function RegisterButton({ slug }: { slug: string }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", organization: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSubmitting(true);
    try {
      await api.registerForWebinar(slug, form);
      setSubmitted(true);
    } catch {
      alert("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded">
        <CheckCircle className="w-4 h-4" /> Registered
      </span>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="btn-x"
      >
        <Calendar className="w-4 h-4" /> Register
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel-x w-72 space-y-3 p-4">
      <input
        type="email"
        placeholder="Email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="field-x"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          className="field-x min-w-0"
        />
        <input
          type="text"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          className="field-x min-w-0"
        />
      </div>
      <input
        type="text"
        placeholder="Organization"
        value={form.organization}
        onChange={(e) => setForm({ ...form, organization: e.target.value })}
        className="field-x"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-x flex-1 disabled:opacity-50"
        >
          {submitting ? "..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="btn-x-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
