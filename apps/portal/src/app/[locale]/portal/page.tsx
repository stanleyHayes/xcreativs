"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Layers3,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

interface Engagement {
  ID: string;
  Sector?: string;
  ServiceLine?: string;
  Title?: string;
  ClientName?: string;
  Stage?: string;
  CurrencyPreference?: string;
  UpdatedAt?: string;
  CreatedAt?: string;
}

interface PortalHome {
  engagements?: Engagement[];
}

const stageOrder = ["discovery", "strategy", "build", "launch", "operate", "completed"];

const quickLinks = [
  { label: "Notifications", href: "notifications", icon: Bell, text: "Unread updates and workspace alerts" },
  { label: "Applications", href: "applications", icon: ClipboardList, text: "Candidate and talent activity" },
  { label: "API Keys", href: "api-keys", icon: ShieldCheck, text: "Secure integration credentials" },
  { label: "Partner desk", href: "partner", icon: Handshake, text: "Orders, products, and referrals" },
];

const operatingRhythm = [
  { label: "Monday pulse", text: "Confirm sprint priorities, blockers, and decision owners." },
  { label: "Midweek evidence", text: "Review demos, documents, approvals, and risk movement." },
  { label: "Friday close", text: "Capture decisions, handoffs, invoices, and next-week commitments." },
];

function formatStage(stage?: string) {
  if (!stage) return "Unstaged";
  return stage.replace(/[_-]/g, " ");
}

function stageProgress(stage?: string) {
  const index = stageOrder.indexOf(String(stage || "").toLowerCase());
  if (index < 0) return 18;
  return Math.min(100, Math.round(((index + 1) / stageOrder.length) * 100));
}

function stageTone(stage?: string) {
  const normalized = String(stage || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("launch")) return "text-green-300 bg-green-400/10 border-green-400/20";
  if (normalized.includes("risk") || normalized.includes("hold")) return "text-red-300 bg-red-400/10 border-red-400/20";
  if (normalized.includes("build") || normalized.includes("progress")) return "text-signal bg-signal/10 border-signal/20";
  return "text-yellow-200 bg-yellow-400/10 border-yellow-400/20";
}

export default function PortalHomePage() {
  const [data, setData] = useState<PortalHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    api
      .getPortalHome()
      .then((d) => { setData(d as PortalHome); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (error) {
    return (
      <div className="portal-panel-x p-8">
        <p className="portal-meta-x">Workspace</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">Portal needs attention</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/56">
          We could not load your portal data. Check the API connection or try again once the workspace service is available.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="portal-skeleton-x h-64" />
          <div className="portal-skeleton-x h-64" />
        </div>
      </div>
    );
  }

  const engagements = data?.engagements || [];
  const activeEngagements = engagements.filter((eng) => String(eng.Stage || "").toLowerCase() !== "completed");
  const clientCount = new Set(engagements.map((eng) => eng.ClientName).filter(Boolean)).size;
  const sectorCount = new Set(engagements.map((eng) => eng.Sector).filter(Boolean)).size;
  const featuredEngagement = engagements[0];
  const averageProgress = engagements.length
    ? Math.round(engagements.reduce((sum, eng) => sum + stageProgress(eng.Stage), 0) / engagements.length)
    : 0;
  const stageCounts = engagements.reduce<Record<string, number>>((acc, eng) => {
    const stage = formatStage(eng.Stage);
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const metrics = [
    { label: "Active engagements", value: activeEngagements.length, icon: Briefcase, detail: `${engagements.length} total workspaces` },
    { label: "Client relationships", value: clientCount, icon: Users, detail: `${sectorCount} sectors represented` },
    { label: "Average progress", value: `${averageProgress}%`, icon: Target, detail: "Stage-weighted delivery pulse" },
    { label: "Workspace modules", value: 12, icon: Layers3, detail: "Delivery, finance, partner, admin" },
  ];

  return (
    <div className="space-y-8">
      <section className="portal-panel-x p-5 sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="portal-meta-x text-signal">Workspace</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-none sm:text-5xl">Portal overview</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              Your protected operating layer for delivery, approvals, decisions, invoices, partner activity, and evidence around active client work.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/${locale}/portal/engagements`} className="portal-btn-x">
                View engagements
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/portal/notifications`} className="portal-btn-secondary-x">
                Review updates
                <Bell className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="portal-card-x p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Current focus</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">
                  {featuredEngagement?.Title || "Workspace readiness"}
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/52">
              {featuredEngagement
                ? `${featuredEngagement.ClientName || "Client"} · ${formatStage(featuredEngagement.Stage)} · ${featuredEngagement.ServiceLine || "service delivery"}`
                : "Once engagements are assigned, this panel will surface the most relevant workstream."}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-signal" style={{ width: `${featuredEngagement ? stageProgress(featuredEngagement.Stage) : 0}%` }} />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/42">
              <span>Stage progress</span>
              <span>{featuredEngagement ? `${stageProgress(featuredEngagement.Stage)}%` : "0%"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="portal-card-x portal-stat-x p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="portal-meta-x">{metric.label}</p>
                <Icon className="h-5 w-5 text-signal" />
              </div>
              <div>
                <p className="font-display text-4xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-sm text-white/45">{metric.detail}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="portal-panel-x p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="portal-meta-x">Active work</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Engagement rooms</h2>
            </div>
            <Link href={`/${locale}/portal/engagements`} className="text-sm font-semibold text-signal transition-colors hover:text-white">
              See all
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {engagements.length === 0 && (
              <div className="portal-card-x col-span-full p-6 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-white/24" />
                <h3 className="font-display mt-3 text-xl font-semibold">No engagements assigned yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/48">
                  Your delivery spaces will appear here once an administrator grants access.
                </p>
              </div>
            )}

            {engagements.slice(0, 4).map((eng) => (
              <Link
                key={eng.ID}
                href={`/${locale}/portal/engagements/${eng.ID}/dashboard`}
                className="portal-card-x group p-5 hover:border-signal/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="portal-meta-x text-signal">
                      {[eng.Sector, eng.ServiceLine].filter(Boolean).join(" · ") || "Engagement"}
                    </p>
                    <h3 className="font-display mt-2 text-xl font-semibold transition-colors group-hover:text-signal">
                      {eng.Title || "Untitled engagement"}
                    </h3>
                    <p className="mt-1 text-sm text-white/48">{eng.ClientName || "Client workspace"}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/24 transition-colors group-hover:text-signal" />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className={`portal-chip-x border ${stageTone(eng.Stage)} capitalize`}>{formatStage(eng.Stage)}</span>
                  {eng.CurrencyPreference && <span className="portal-chip-x">{eng.CurrencyPreference}</span>}
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${stageProgress(eng.Stage)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="portal-panel-x p-5 sm:p-6">
            <p className="portal-meta-x">Stage mix</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">Delivery shape</h2>
            <div className="mt-5 space-y-3">
              {Object.entries(stageCounts).length === 0 && <p className="text-sm text-white/45">No stage data yet.</p>}
              {Object.entries(stageCounts).map(([stage, count]) => (
                <div key={stage}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize text-white/68">{stage}</span>
                    <span className="text-white/42">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${Math.max(12, (count / Math.max(1, engagements.length)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-card-x p-5">
            <p className="portal-meta-x">Operating rhythm</p>
            <div className="mt-4 space-y-4">
              {operatingRhythm.map((item, index) => (
                <div key={item.label} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-xs font-semibold text-signal">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/48">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={`/${locale}/portal/${item.href}`} className="portal-card-x group p-5 hover:border-signal/50">
              <div className="flex items-start justify-between gap-4">
                <Icon className="h-5 w-5 text-signal" />
                <ArrowRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-signal" />
              </div>
              <h3 className="mt-4 font-semibold">{item.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/45">{item.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="portal-panel-x p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: CheckCircle2, title: "Decision trail", text: "Keep approvals, blockers, and owner notes attached to the work." },
            { icon: CalendarDays, title: "Delivery cadence", text: "Use milestones and reports to keep expectations visible." },
            { icon: LifeBuoy, title: "Support lane", text: "Raise tickets with priority, SLA, and resolution status in one place." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-signal">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/48">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
