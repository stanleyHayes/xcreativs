"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { DashboardResponse } from "@xc/api/types";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Flag,
  Gauge,
  LifeBuoy,
  MessageSquareText,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Milestone {
  ID?: string;
  Status?: string;
  Title?: string;
  Description?: string;
}

interface Activity {
  ID?: string;
  ActorName?: string;
  Action?: string;
  ResourceType?: string;
  CreatedAt?: string;
}

function formatStatus(status?: string) {
  if (!status) return "Unstaged";
  return status.replace(/[_-]/g, " ");
}

function statusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("done")) return "text-green-300 bg-green-400/10 border-green-400/20";
  if (normalized.includes("progress") || normalized.includes("active")) return "text-signal bg-signal/10 border-signal/20";
  if (normalized.includes("block") || normalized.includes("risk")) return "text-red-300 bg-red-400/10 border-red-400/20";
  return "text-yellow-200 bg-yellow-400/10 border-yellow-400/20";
}

function formatActivityDate(value?: string) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleString();
}

export default function DashboardPage() {
  const { id, locale } = useParams();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getDashboard(id as string).then((d) => { setData(d); setLoading(false); }).catch(() => { setError("Failed to load data"); setLoading(false); });
  }, [id]);

  if (error) {
    return (
      <PortalEmptyState
        icon={AlertTriangle}
        eyebrow="Dashboard"
        title="Workspace data unavailable"
        description={error}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div className="portal-skeleton-x h-80" />
          <div className="portal-skeleton-x h-80" />
        </div>
      </div>
    );
  }

  const milestones = (data?.milestones || []).map((entity) => entity as Milestone);
  const activity = (data?.recent_activity || []).map((entity) => entity as Activity);
  const completed = milestones.filter((m) => String(m.Status || "").toLowerCase().includes("complete")).length;
  const inProgress = milestones.filter((m) => String(m.Status || "").toLowerCase().includes("progress")).length;
  const completion = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;

  const metrics = [
    { label: "Completion", value: `${completion}%`, icon: Gauge, detail: `${completed} of ${milestones.length} milestones done` },
    { label: "In progress", value: inProgress, icon: Clock, detail: "Milestones moving now" },
    { label: "Activity", value: activity.length, icon: MessageSquareText, detail: "Recent workspace events" },
    { label: "Open work", value: Math.max(0, milestones.length - completed), icon: Flag, detail: "Remaining milestones" },
  ];

  const commandLinks = [
    { label: "Deliverables", href: "deliverables", icon: FileText, text: "Files, versions, visibility, and signature state" },
    { label: "Decisions", href: "decisions", icon: Scale, text: "Open choices, owner notes, and final outcomes" },
    { label: "Risks", href: "risks", icon: ShieldAlert, text: "Severity, mitigation, residual rating, and escalation" },
    { label: "Support", href: "tickets", icon: LifeBuoy, text: "Requests, priority, SLA targets, and resolution trail" },
  ];

  return (
    <div className="space-y-8">
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

      <section className="portal-panel-x p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="portal-meta-x">Delivery pulse</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">Milestone progress</h2>
              </div>
              <Link href={`/${locale}/portal/engagements/${id}/milestones`} className="text-sm font-semibold text-signal transition-colors hover:text-white">
                Manage milestones
              </Link>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-signal" style={{ width: `${completion}%` }} />
            </div>

            <div className="mt-5 space-y-3">
              {milestones.length === 0 && (
                <div className="portal-card-x p-6 text-center">
                  <Flag className="mx-auto h-8 w-8 text-white/24" />
                  <h3 className="font-display mt-3 text-xl font-semibold">No milestones yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/48">
                    Add milestones to turn this dashboard into a clearer delivery timeline.
                  </p>
                </div>
              )}

              {milestones.slice(0, 6).map((m) => (
                <div key={m.ID || m.Title} className="portal-card-x flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {String(m.Status || "").toLowerCase().includes("complete") ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                  ) : String(m.Status || "").toLowerCase().includes("progress") ? (
                    <Clock className="h-5 w-5 shrink-0 text-signal" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-white/30" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.Title || "Untitled milestone"}</p>
                    {m.Description && <p className="mt-1 text-sm text-white/50">{m.Description}</p>}
                  </div>
                  <span className={`portal-chip-x border capitalize ${statusTone(m.Status)}`}>{formatStatus(m.Status)}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="portal-card-x p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="portal-meta-x">Command links</p>
                  <h3 className="font-display mt-2 text-xl font-semibold">Where to move next</h3>
                </div>
                <Sparkles className="h-5 w-5 text-signal" />
              </div>
              <div className="mt-4 space-y-3">
                {commandLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={`/${locale}/portal/engagements/${id}/${item.href}`}
                      className="group flex gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 transition-colors hover:border-signal/45"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-white/42">{item.text}</span>
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/20 transition-colors group-hover:text-signal" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="portal-panel-x p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="portal-meta-x">Activity stream</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Recent activity</h2>
            </div>
            <span className="portal-chip-x">{activity.length} events</span>
          </div>

          <div className="mt-5 space-y-4">
            {activity.length === 0 && (
              <div className="portal-card-x p-6 text-center">
                <MessageSquareText className="mx-auto h-8 w-8 text-white/24" />
                <h3 className="font-display mt-3 text-xl font-semibold">No activity yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/48">
                  Updates will appear here as the engagement moves through milestones, comments, approvals, and document changes.
                </p>
              </div>
            )}

            {activity.slice(0, 8).map((a) => (
              <div key={a.ID || `${a.ActorName}-${a.CreatedAt}`} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                <div className="min-w-0">
                  <p>
                    <span className="font-semibold">{a.ActorName || "Workspace"}</span>{" "}
                    <span className="text-white/52">{a.Action || "updated"}</span>{" "}
                    <span className="text-white/76">{a.ResourceType || "item"}</span>
                  </p>
                  <p className="mt-1 text-xs text-white/32">{formatActivityDate(a.CreatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="portal-panel-x p-5 sm:p-6">
          <p className="portal-meta-x">Governance brief</p>
          <h2 className="font-display mt-2 text-2xl font-semibold">Keep the work inspectable</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: "Decision ownership", text: "Every material choice should carry owner, status, context, and final outcome." },
              { label: "Evidence cadence", text: "Deliverables, demos, reports, and approvals should tell the project story without a meeting." },
              { label: "Risk visibility", text: "Escalated risks belong near mitigation, residual rating, and the next accountable action." },
            ].map((item, index) => (
              <div key={item.label} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-xs font-semibold text-signal">
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
      </section>
    </div>
  );
}
