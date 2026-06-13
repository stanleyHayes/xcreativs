"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowLeft, Calendar, Clock, Users, Video, Radio, CheckCircle, CalendarPlus } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Upcoming", color: "text-signal", bg: "bg-signal/10" },
  live: { label: "Live Now", color: "text-red-500", bg: "bg-red-500/10" },
  recorded: { label: "Recorded", color: "text-green-600", bg: "bg-green-600/10" },
  cancelled: { label: "Cancelled", color: "text-gravity/30", bg: "bg-gravity/5" },
};

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildICS(w: any): string {
  const start = new Date(w.ScheduledAt);
  const end = new Date(start.getTime() + (w.DurationMinutes || 60) * 60000);
  const esc = (s: string) => (s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//XCreativs//Webinars//EN",
    "BEGIN:VEVENT",
    `UID:${w.Slug}@xcreativs.com`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${esc(w.Title)}`,
    `DESCRIPTION:${esc(w.Description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleCalUrl(w: any): string {
  const start = new Date(w.ScheduledAt);
  const end = new Date(start.getTime() + (w.DurationMinutes || 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: w.Title || "XCreativs Webinar",
    dates: `${toICSDate(start)}/${toICSDate(end)}`,
    details: w.Description || "",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export default function WebinarDetailPage() {
  const { slug } = useParams();
  const [w, setW] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getWebinar(slug as string).then((d) => setW(d)).catch(() => setW(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!w) return <div className="p-12 text-center">Webinar not found</div>;

  const cfg = statusConfig[w.Status] || statusConfig.upcoming;
  const when = new Date(w.ScheduledAt);

  function downloadICS() {
    const blob = new Blob([buildICS(w)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${w.Slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/webinars" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Webinars
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>
            {w.Status === "live" ? <Radio className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />} {cfg.label}
          </span>
          <h1 className="mt-3 text-3xl lg:text-5xl font-bold">{w.Title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gravity/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {when.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {w.DurationMinutes} min
            </span>
            {w.SpeakerNames?.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {w.SpeakerNames.join(", ")}
              </span>
            )}
          </div>

          {w.CoverImageURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.CoverImageURL} alt={w.Title} className="mt-8 w-full rounded-lg border border-hairline" />
          )}

          <article className="mt-8 max-w-3xl prose prose-lg text-gravity/80">
            <p className="whitespace-pre-line leading-relaxed">{w.Description}</p>
          </article>
        </div>

        <aside className="space-y-4">
          {w.Status === "recorded" && w.RecordingURL && (
            <a
              href={w.RecordingURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-signal text-white text-sm font-medium rounded hover:opacity-90 transition-opacity"
            >
              <Video className="w-4 h-4" /> Watch Recording
            </a>
          )}

          {(w.Status === "upcoming" || w.Status === "live") && <RegisterForm slug={w.Slug as string} />}

          {w.Status !== "cancelled" && (
            <div className="border border-hairline rounded-lg p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-3">Add to calendar</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={downloadICS}
                  className="inline-flex items-center gap-2 text-sm text-gravity/70 hover:text-signal transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" /> Apple / Outlook (.ics)
                </button>
                <a
                  href={googleCalUrl(w)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gravity/70 hover:text-signal transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" /> Google Calendar
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function RegisterForm({ slug }: { slug: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", organization: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.registerForWebinar(slug, form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-hairline rounded-lg p-4 bg-soft text-center">
        <CheckCircle className="w-6 h-6 text-signal mx-auto mb-2" />
        <p className="text-sm font-medium">You are registered</p>
        <p className="text-xs text-gravity/50 mt-1">We will email you the joining link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-hairline rounded-lg p-4 space-y-2">
      <p className="text-sm font-semibold mb-1">Register</p>
      <input
        type="email"
        required
        placeholder="Email *"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-3 py-2 border border-hairline rounded text-sm focus:outline-none focus:border-signal bg-foundation"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          className="flex-1 min-w-0 px-3 py-2 border border-hairline rounded text-sm focus:outline-none focus:border-signal bg-foundation"
        />
        <input
          type="text"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          className="flex-1 min-w-0 px-3 py-2 border border-hairline rounded text-sm focus:outline-none focus:border-signal bg-foundation"
        />
      </div>
      <input
        type="text"
        placeholder="Organization"
        value={form.organization}
        onChange={(e) => setForm({ ...form, organization: e.target.value })}
        className="w-full px-3 py-2 border border-hairline rounded text-sm focus:outline-none focus:border-signal bg-foundation"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-3 py-2 bg-signal text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? "Registering..." : "Confirm Registration"}
      </button>
    </form>
  );
}
