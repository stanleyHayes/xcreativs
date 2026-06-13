"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { ClipboardList, CheckCircle, XCircle, Clock, Search } from "lucide-react";

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
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    api.listPartnerApplications(statusFilter)
      .then((d) => {
        setApplications((d.applications as unknown as PartnerApplication[]) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter]);

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
    const q = filter.toLowerCase();
    return (
      !q ||
      a.OrgName?.toLowerCase().includes(q) ||
      a.ContactName?.toLowerCase().includes(q) ||
      a.ContactEmail?.toLowerCase().includes(q) ||
      a.PartnerType?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="text-white/60">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-signal" /> Partner Applications</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-signal"
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-white/30" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by org, contact, or type..."
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-white/30"
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {["applied", "under_review", "approved", "rejected", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`border rounded-lg p-3 text-left transition-colors ${statusFilter === s ? "border-signal bg-signal/5" : "border-white/10 hover:border-white/20"}`}
          >
            <p className="text-2xl font-bold">{applications.filter((a) => a.Status === s).length}</p>
            <p className="text-xs text-white/50 capitalize">{s.replace("_", " ")}</p>
          </button>
        ))}
      </div>

      {/* Applications table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/50 text-xs uppercase">
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
                  <td className="px-4 py-3">
                    <p className="font-medium">{app.OrgName}</p>
                    {app.OrgWebsite && <p className="text-xs text-white/40">{app.OrgWebsite.replace("https://", "")}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p>{app.ContactName}</p>
                    <p className="text-xs text-white/40">{app.ContactEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize">{app.PartnerType?.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded uppercase font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-white/40">
                    {new Date(app.CreatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setSelected(app); setNotes(app.Notes || ""); }} className="text-xs text-signal hover:underline">
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-white/40 py-8 text-sm">No applications found.</p>}
      </div>

      {/* Detail / action modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gravity border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selected.OrgName}</h2>
                  <p className="text-sm text-white/50">{selected.ContactName} · {selected.ContactEmail}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded p-3">
                  <p className="text-xs text-white/40 uppercase">Type</p>
                  <p className="capitalize">{selected.PartnerType?.replace("_", " ")}</p>
                </div>
                <div className="bg-white/5 rounded p-3">
                  <p className="text-xs text-white/40 uppercase">Phone</p>
                  <p>{selected.ContactPhone || "—"}</p>
                </div>
                <div className="bg-white/5 rounded p-3">
                  <p className="text-xs text-white/40 uppercase">Website</p>
                  <p>{selected.OrgWebsite || "—"}</p>
                </div>
                <div className="bg-white/5 rounded p-3">
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
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction(selected.ID, "approved")}
                  disabled={actionLoading || selected.Status === "approved"}
                  className="flex-1 bg-green-400/20 text-green-400 border border-green-400/30 px-4 py-2 rounded text-sm font-medium hover:bg-green-400/30 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" /> Approve
                </button>
                <button
                  onClick={() => handleAction(selected.ID, "under_review")}
                  disabled={actionLoading}
                  className="flex-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-4 py-2 rounded text-sm font-medium hover:bg-yellow-400/30 disabled:opacity-40 transition-colors"
                >
                  <Clock className="w-4 h-4 inline mr-1" /> Under Review
                </button>
                <button
                  onClick={() => handleAction(selected.ID, "rejected")}
                  disabled={actionLoading || selected.Status === "rejected"}
                  className="flex-1 bg-red-400/20 text-red-400 border border-red-400/30 px-4 py-2 rounded text-sm font-medium hover:bg-red-400/30 disabled:opacity-40 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-1" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
