"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Activity, Clock3, Download, Eye, FileSearch, RefreshCw, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { api } from "@xc/api";
import type { Entity } from "@xc/api/types";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

const ACTION_FILTERS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type ActionFilter = (typeof ACTION_FILTERS)[number];

interface AuditEntry {
  id: string;
  time: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  statusCode: string;
  userId: string;
  userEmail: string;
  userName: string;
}

function valueAsString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeAuditEntry(entry: Entity): AuditEntry {
  const record = entry as Record<string, unknown>;
  return {
    id: valueAsString(record, "id"),
    time: valueAsString(record, "time"),
    action: valueAsString(record, "action").toUpperCase(),
    resource: valueAsString(record, "resource"),
    resourceId: valueAsString(record, "resource_id"),
    ipAddress: valueAsString(record, "ip_address"),
    userAgent: valueAsString(record, "user_agent"),
    statusCode: valueAsString(record, "status_code"),
    userId: valueAsString(record, "user_id"),
    userEmail: valueAsString(record, "user_email"),
    userName: valueAsString(record, "user_name"),
  };
}

function filtersFor(action: ActionFilter, query: string): Record<string, string> {
  const filters: Record<string, string> = { limit: "250" };
  if (action !== "ALL") filters.action = action;
  if (query.trim()) filters.q = query.trim();
  return filters;
}

function formatWhen(value: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(statusCode: string): string {
  const status = Number(statusCode);
  if (!statusCode || Number.isNaN(status)) return "border-white/10 bg-white/[0.04] text-white/52";
  if (status >= 500) return "border-red-400/30 bg-red-400/10 text-red-200";
  if (status >= 400) return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (status >= 300) return "border-sky-300/35 bg-sky-300/10 text-sky-100";
  return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
}

function actionTone(action: string): string {
  if (action === "GET") return "border-signal/30 bg-signal/10 text-signal";
  if (action === "DELETE") return "border-red-400/30 bg-red-400/10 text-red-200";
  if (action === "POST") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  return "border-amber-300/35 bg-amber-300/10 text-amber-100";
}

function actorLabel(entry: AuditEntry): string {
  return entry.userName || entry.userEmail || entry.userId || "Unknown user";
}

export default function AdminAuditLogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const filters = useMemo(() => filtersFor(actionFilter, appliedQuery), [actionFilter, appliedQuery]);

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setError("");

      try {
        const data = await api.listAuditLogsAdmin(filters);
        if (!active) return;
        setEntries((data.entries || []).map(normalizeAuditEntry));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Audit logs are unavailable");
        setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filters, refreshIndex]);

  const stats = useMemo(() => {
    const reads = entries.filter((entry) => entry.action === "GET").length;
    const writes = entries.filter((entry) => entry.action !== "GET").length;
    const actors = new Set(entries.map((entry) => entry.userEmail || entry.userId || entry.ipAddress).filter(Boolean));
    const failures = entries.filter((entry) => Number(entry.statusCode) >= 400).length;

    return [
      { label: "Captured events", value: entries.length.toLocaleString(), icon: Activity },
      { label: "Authenticated reads", value: reads.toLocaleString(), icon: Eye },
      { label: "Writes", value: writes.toLocaleString(), icon: ShieldCheck },
      { label: "Actors", value: actors.size.toLocaleString(), icon: UserRoundCheck },
      { label: "Failures", value: failures.toLocaleString(), icon: FileSearch },
      { label: "Newest event", value: entries[0] ? formatWhen(entries[0].time) : "None", icon: Clock3 },
    ];
  }, [entries]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  async function handleExportCSV() {
    setExporting(true);
    setError("");

    try {
      const params = new URLSearchParams(filters);
      params.set("format", "csv");
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export audit logs");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Admin audit</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Audit logs</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Review authenticated portal reads, writes, actors, IP addresses, status codes, and exportable trail evidence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {ACTION_FILTERS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setActionFilter(action)}
                className={`portal-chip-x ${actionFilter === action ? "portal-chip-x-active" : ""}`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="portal-card-x portal-stat-x p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="portal-meta-x">{stat.label}</p>
                <Icon className="h-4 w-4 text-signal" />
              </div>
              <p className="font-display truncate text-2xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <section className="portal-panel-x p-4 sm:p-5">
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search audit logs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search user, route, resource id..."
              className="portal-field-x portal-field-icon-x"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-signal px-4 text-sm font-semibold text-white shadow-lg shadow-signal/20 transition-colors hover:bg-signal/90"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
            <button
              type="button"
              onClick={() => setRefreshIndex((current) => current + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/68 transition-colors hover:border-signal/45 hover:text-signal"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/68 transition-colors hover:border-signal/45 hover:text-signal disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting" : "Export CSV"}
          </button>
        </form>

        {appliedQuery && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/48">
            <span>Filtered by {appliedQuery}</span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setAppliedQuery("");
              }}
              className="text-signal hover:text-signal/80"
            >
              Clear
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </section>

      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="portal-skeleton-x h-20" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <PortalEmptyState
          icon={FileSearch}
          eyebrow="No matching events"
          title="No audit logs found"
          description="Authenticated portal reads and writes will appear here as users move through the workspace."
          action={
            <button
              type="button"
              onClick={() => setRefreshIndex((current) => current + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-signal px-4 text-sm font-semibold text-white shadow-lg shadow-signal/20 transition-colors hover:bg-signal/90"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh logs
            </button>
          }
        />
      ) : (
        <section className="portal-panel-x overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
            <div>
              <p className="portal-meta-x">Trail</p>
              <h2 className="font-display mt-1 text-xl font-semibold">Recent authenticated activity</h2>
            </div>
            <span className="portal-chip-x">{entries.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-white/38">
                <tr>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Resource</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">IP</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <tr key={entry.id || `${entry.time}-${entry.resource}-${entry.userId}`} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4 text-white/68">{formatWhen(entry.time)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${actionTone(entry.action)}`}>
                        {entry.action || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white/82">{entry.resource || "Unknown route"}</p>
                      {entry.resourceId && <p className="mt-1 max-w-xs truncate text-xs text-white/40">{entry.resourceId}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white/76">{actorLabel(entry)}</p>
                      {entry.userEmail && <p className="mt-1 text-xs text-white/42">{entry.userEmail}</p>}
                    </td>
                    <td className="px-5 py-4 text-white/58">{entry.ipAddress || "Unknown"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${statusTone(entry.statusCode)}`}>
                        {entry.statusCode || "n/a"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[17rem] truncate text-xs text-white/46">{entry.userAgent || "Not captured"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
