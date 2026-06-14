"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, MousePointerClick, FileText, Briefcase, Globe, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AnalyticsMetrics {
  visitors_30d?: number;
  page_views_30d?: number;
  diagnostics_started_30d?: number;
  rfps_submitted_30d?: number;
  portal_logins_30d?: number;
  portal_actions_30d?: number;
  new_applications_30d?: number;
  new_partnerships_30d?: number;
  active_engagements?: number;
  active_users?: number;
}

interface DailyView {
  day: string;
  views: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface AnalyticsFunnel {
  visitors?: number;
  diagnostics?: number;
  rfps?: number;
  portal_users?: number;
}

interface AnalyticsData {
  metrics?: AnalyticsMetrics;
  daily_views?: DailyView[];
  top_pages?: TopPage[];
  funnel?: AnalyticsFunnel;
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/60">Loading analytics...</div>;
  if (!data) return <div className="text-white/60">Failed to load analytics.</div>;

  const { metrics, daily_views, top_pages, funnel } = data;

  const maxViews = Math.max(...(daily_views || []).map((d: DailyView) => d.views), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-signal" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics Dashboard</h1>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Globe} label="Visitors (30d)" value={metrics?.visitors_30d || 0} color="text-signal" />
        <MetricCard icon={MousePointerClick} label="Page Views (30d)" value={metrics?.page_views_30d || 0} color="text-blue-400" />
        <MetricCard icon={Activity} label="Diagnostics Started" value={metrics?.diagnostics_started_30d || 0} color="text-purple-400" />
        <MetricCard icon={FileText} label="RFPs Submitted" value={metrics?.rfps_submitted_30d || 0} color="text-green-400" />
        <MetricCard icon={Users} label="Portal Logins" value={metrics?.portal_logins_30d || 0} color="text-yellow-400" />
        <MetricCard icon={Briefcase} label="Portal Actions" value={metrics?.portal_actions_30d || 0} color="text-pink-400" />
        <MetricCard icon={TrendingUp} label="New Applications" value={metrics?.new_applications_30d || 0} color="text-orange-400" />
        <MetricCard icon={TrendingDown} label="New Partnerships" value={metrics?.new_partnerships_30d || 0} color="text-cyan-400" />
      </div>

      {/* Conversion funnel */}
      <div className="portal-card-x p-5">
        <h2 className="font-semibold mb-4">Conversion Funnel (30 days)</h2>
        <div className="space-y-3">
          {[
            { label: "Unique Visitors", value: funnel?.visitors || 0, max: funnel?.visitors || 1 },
            { label: "Started Diagnostic", value: funnel?.diagnostics || 0, max: funnel?.visitors || 1 },
            { label: "Submitted RFP", value: funnel?.rfps || 0, max: funnel?.visitors || 1 },
            { label: "Active Portal Users", value: funnel?.portal_users || 0, max: funnel?.visitors || 1 },
          ].map((step) => {
            const pct = Math.round((step.value / step.max) * 100);
            return (
              <div key={step.label} className="flex items-center gap-4">
                <div className="w-36 text-sm text-white/60">{step.label}</div>
                <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-signal/30 rounded transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {step.value.toLocaleString()} ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily views chart */}
        <div className="portal-card-x p-5">
          <h2 className="font-semibold mb-4">Daily Page Views (30 days)</h2>
          <div className="flex items-end gap-1 h-40">
            {(daily_views || []).map((d: DailyView) => (
              <div
                key={d.day}
                className="flex-1 bg-signal/40 hover:bg-signal/60 rounded-t transition-colors relative group"
                style={{ height: `${(d.views / maxViews) * 100}%` }}
                title={`${d.day}: ${d.views} views`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gravity border border-white/10 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {d.views}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            {(daily_views || []).length > 0 && (
              <>
                <span>{daily_views?.[0]?.day?.slice(5)}</span>
                <span>{daily_views?.[daily_views.length - 1]?.day?.slice(5)}</span>
              </>
            )}
          </div>
        </div>

        {/* Top pages */}
        <div className="portal-card-x p-5">
          <h2 className="font-semibold mb-4">Top Pages (30 days)</h2>
          <div className="space-y-2">
            {(top_pages || []).map((p: TopPage, i: number) => (
              <div key={p.path} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 w-4">{i + 1}</span>
                  <span className="text-sm truncate max-w-[200px]">{p.path || "/"}</span>
                </div>
                <span className="text-sm font-medium">{p.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firm stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="portal-card-x p-4 text-center">
          <p className="text-3xl font-bold text-signal">{metrics?.active_engagements || 0}</p>
          <p className="text-xs text-white/50 mt-1">Active Engagements</p>
        </div>
        <div className="portal-card-x p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{metrics?.active_users || 0}</p>
          <p className="text-xs text-white/50 mt-1">Active Users (30d)</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: string }) {
  return (
    <div className="portal-card-x p-4">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <p className="font-display text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}
