"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@xc/api";
import { ArrowRight, Briefcase, Calendar, CheckCircle, Clock, ClipboardList, Mail, Sparkles, XCircle } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface JobApplication {
  ID: string;
  Status: string;
  Answers?: Record<string, string> | null;
  CreatedAt: string;
  Notes?: string | null;
  ReviewedAt?: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  received: { icon: <Mail className="w-4 h-4" />, color: "text-white/60", label: "Received", bg: "bg-white/5" },
  under_review: { icon: <Clock className="w-4 h-4" />, color: "text-yellow-400", label: "Under Review", bg: "bg-yellow-400/10" },
  interview_scheduled: { icon: <Calendar className="w-4 h-4" />, color: "text-signal", label: "Interview Scheduled", bg: "bg-signal/10" },
  offer: { icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400", label: "Offer", bg: "bg-green-400/10" },
  declined: { icon: <XCircle className="w-4 h-4" />, color: "text-red-400", label: "Declined", bg: "bg-red-400/10" },
  withdrawn: { icon: <XCircle className="w-4 h-4" />, color: "text-white/30", label: "Withdrawn", bg: "bg-white/5" },
};

export default function MyApplicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const marketingURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const careersHref = `${marketingURL}${locale === "fr" ? "/fr" : ""}/careers`;

  useEffect(() => {
    api.myApplications()
      .then((d) => { setApplications((d.applications ?? []) as unknown as JobApplication[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
        <div className="space-y-3">
          {[0, 1].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
      </div>
    );
  }

  const activeCount = applications.filter((app) => !["declined", "withdrawn"].includes(app.Status)).length;
  const interviewCount = applications.filter((app) => app.Status === "interview_scheduled").length;
  const latestApplication = applications[0];

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <ClipboardList className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Talent desk</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              My applications
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Track every role, review stage, interview signal, and hiring update connected to your XCreativs profile.
            </p>
          </div>

          <div className="portal-card-x p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Latest activity</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">
                  {latestApplication?.Answers?.["_role_title"] || "No active role yet"}
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {latestApplication
                ? `Applied ${new Date(latestApplication.CreatedAt).toLocaleDateString()} · ${statusConfig[latestApplication.Status]?.label || latestApplication.Status}`
                : "Once you apply, the latest application will surface here."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Applications", value: applications.length, icon: Briefcase },
          { label: "Active", value: activeCount, icon: Clock },
          { label: "Interviews", value: interviewCount, icon: Calendar },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="portal-card-x portal-stat-x p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="portal-meta-x">{metric.label}</p>
                <Icon className="h-5 w-5 text-signal" />
              </div>
              <p className="font-display text-4xl font-semibold">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="portal-panel-x p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="portal-meta-x">Pipeline</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">Application history</h2>
          </div>
          <a href={careersHref} className="portal-btn-secondary-x">
            Browse roles
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-5 space-y-4">
          {applications.map((app) => {
            const config = statusConfig[app.Status] || statusConfig.received;
            const roleTitle = app.Answers?.["_role_title"] || "Unknown role";
            return (
              <div key={app.ID} className="portal-card-x p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${config.bg} ${config.color}`}>
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="portal-meta-x">Role</p>
                      <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">{roleTitle}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${config.color} ${config.bg}`}>
                          {config.icon}
                          {config.label}
                        </span>
                        <span className="portal-chip-x">
                          Applied {new Date(app.CreatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {app.Notes && (
                        <p className="mt-4 max-w-2xl rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm leading-relaxed text-white/55">
                          {app.Notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/8 bg-white/[0.035] p-4 md:w-48">
                    <p className="portal-meta-x">Last movement</p>
                    <p className="mt-2 text-sm text-white/60">
                      {app.ReviewedAt ? new Date(app.ReviewedAt).toLocaleDateString() : "Awaiting review"}
                    </p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-signal"
                        style={{ width: app.ReviewedAt || app.Status !== "received" ? "68%" : "24%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {applications.length === 0 && (
            <PortalEmptyState
              icon={Briefcase}
              eyebrow="Ready when you are"
              title="No applications yet"
              description="Open roles you apply for will appear here with status, review notes, interviews, and next steps."
              action={
                <a href={careersHref} className="portal-btn-x">
                  Browse open roles
                  <ArrowRight className="h-4 w-4" />
                </a>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
