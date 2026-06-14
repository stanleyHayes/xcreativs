"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { CheckCircle, ClipboardList, Clock, ListFilter, RefreshCw, Search, X, XCircle } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface PartnerApplication {
  ID: string;
  Status: string;
  OrgName?: string;
  OrgWebsite?: string;
  ContactName?: string;
  ContactEmail?: string;
  ContactPhone?: string;
  PartnerType?: string;
  TargetMarkets?: string[];
  ExistingProduct?: string;
  DomainExpertise?: string;
  TractionMetrics?: string;
  WhatTheyNeed?: string;
  WhatTheyBring?: string;
  Notes?: string;
  CreatedAt: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  applied: { color: "text-white/60", bg: "bg-white/5", icon: <Clock className="w-3.5 h-3.5" />, label: "Applied" },
  under_review: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <Clock className="w-3.5 h-3.5" />, label: "Under Review" },
  approved: { color: "text-green-400", bg: "bg-green-400/10", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Approved" },
  rejected: { color: "text-red-400", bg: "bg-red-400/10", icon: <XCircle className="w-3.5 h-3.5" />, label: "Rejected" },
  inactive: { color: "text-white/30", bg: "bg-white/5", icon: <XCircle className="w-3.5 h-3.5" />, label: "Inactive" },
};

export default function AdminPartnerApplicationsPage() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    api.listPartnerApplications()
      .then((d) => {
        setLoadError("");
        setApplications((d.applications as unknown as PartnerApplication[]) || []);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load partner applications");
        setApplications([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await api.updatePartnerApplication(id, { status, notes });
      setSelected(null);
      setNotes("");
      load();
    } catch {
      alert("Failed to update application");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = applications.filter((a) => {
    const q = filter.trim().toLowerCase();
    const matchesSearch = !q ||
      a.OrgName?.toLowerCase().includes(q) ||
      a.ContactName?.toLowerCase().includes(q) ||
      a.ContactEmail?.toLowerCase().includes(q) ||
      a.PartnerType?.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || a.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const hasFilters = Boolean(filter.trim() || statusFilter);
  const clearFilters = () => {
    setFilter("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="portal-skeleton-x h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Partner intake</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Partner applications</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Triage partner submissions, inspect market fit, capture notes, and move qualified relationships through review.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="portal-field-x sm:w-48">
              <option value="">All statuses</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={load} className="portal-btn-secondary-x" type="button">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      )}

      <section className="portal-panel-x p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by organisation, contact, email, or type"
              className="portal-field-x portal-field-icon-x pr-4"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setFilter(filter.trim())} className="portal-btn-secondary-x">
              <Search className="h-4 w-4" />
              Search
            </button>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="portal-admin-action-x">
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/42">
          <ListFilter className="h-3.5 w-3.5 text-signal" />
          <span>
            Showing {filtered.length} of {applications.length} partner applications
            {statusFilter ? ` · ${statusFilter.replace("_", " ")}` : ""}
          </span>
        </div>
      </section>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {["applied", "under_review", "approved", "rejected", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`portal-card-x min-h-[5.75rem] p-3 text-left transition-colors ${statusFilter === s ? "border-signal/60 bg-signal/10" : "hover:border-white/20"}`}
          >
            <p className="font-display text-3xl font-semibold">{applications.filter((a) => a.Status === s).length}</p>
            <p className="text-xs capitalize leading-tight text-white/50">{s.replace("_", " ")}</p>
          </button>
        ))}
      </div>

      {/* Applications table */}
      <div className="portal-panel-x portal-scrollbar-x overflow-x-auto">
        <table className="portal-admin-table-x min-w-[760px]">
          <thead>
            <tr>
              <th className="text-left px-4 py-3">Organisation</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((app) => {
              const cfg = statusConfig[app.Status] || statusConfig.applied;
              return (
                <tr key={app.ID} className="hover:bg-white/5 transition-colors">
                  <td>
                    <p className="font-medium">{app.OrgName}</p>
                    {app.OrgWebsite && <p className="text-xs text-white/40">{app.OrgWebsite.replace("https://", "")}</p>}
                  </td>
                  <td className="hidden md:table-cell">
                    <p>{app.ContactName}</p>
                    <p className="text-xs text-white/40">{app.ContactEmail}</p>
                  </td>
                  <td>
                    <span className="text-xs capitalize">{app.PartnerType?.replace("_", " ")}</span>
                  </td>
                  <td>
                    <span className={`portal-chip-x uppercase ${cfg.color} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="hidden text-white/40 md:table-cell">
                    {new Date(app.CreatedAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <button onClick={() => { setSelected(app); setNotes(app.Notes || ""); }} className="portal-admin-action-x">
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-4">
            <PortalEmptyState
              compact
              icon={ClipboardList}
              title="No applications found"
              description={hasFilters ? "Clear the search or status filter to return to the full partner intake list." : "Partner applications will appear here as submissions arrive."}
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className="portal-btn-secondary-x">
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Detail / action modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="portal-panel-x portal-scrollbar-x max-h-[90vh] w-full max-w-2xl overflow-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selected.OrgName}</h2>
                  <p className="text-sm text-white/50">{selected.ContactName} · {selected.ContactEmail}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 uppercase">Type</p>
                  <p className="capitalize">{selected.PartnerType?.replace("_", " ")}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 uppercase">Phone</p>
                  <p>{selected.ContactPhone || "—"}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 uppercase">Website</p>
                  <p>{selected.OrgWebsite || "—"}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 uppercase">Markets</p>
                  <p>{selected.TargetMarkets?.join(", ") || "—"}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selected.ExistingProduct && (
                  <div>
                    <p className="text-xs text-white/40 uppercase">Existing Product</p>
                    <p className="text-sm mt-1">{selected.ExistingProduct}</p>
                  </div>
                )}
                {selected.DomainExpertise && (
                  <div>
                    <p className="text-xs text-white/40 uppercase">Domain Expertise</p>
                    <p className="text-sm mt-1">{selected.DomainExpertise}</p>
                  </div>
                )}
                {selected.TractionMetrics && (
                  <div>
                    <p className="text-xs text-white/40 uppercase">Traction</p>
                    <p className="text-sm mt-1">{selected.TractionMetrics}</p>
                  </div>
                )}
                {selected.WhatTheyNeed && (
                  <div>
                    <p className="text-xs text-white/40 uppercase">What they need from XCreativs</p>
                    <p className="text-sm mt-1">{selected.WhatTheyNeed}</p>
                  </div>
                )}
                {selected.WhatTheyBring && (
                  <div>
                    <p className="text-xs text-white/40 uppercase">What they bring</p>
                    <p className="text-sm mt-1">{selected.WhatTheyBring}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase mb-1">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="portal-field-x w-full h-20"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleAction(selected.ID, "approved")}
                  disabled={actionLoading || selected.Status === "approved"}
                  className="portal-admin-action-x border-green-400/30 bg-green-400/15 text-green-300 hover:bg-green-400/25 disabled:opacity-40"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(selected.ID, "under_review")}
                  disabled={actionLoading}
                  className="portal-admin-action-x border-yellow-400/30 bg-yellow-400/15 text-yellow-200 hover:bg-yellow-400/25 disabled:opacity-40"
                >
                  <Clock className="h-4 w-4" /> Under review
                </button>
                <button
                  onClick={() => handleAction(selected.ID, "rejected")}
                  disabled={actionLoading || selected.Status === "rejected"}
                  className="portal-admin-action-x portal-admin-action-danger-x disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
