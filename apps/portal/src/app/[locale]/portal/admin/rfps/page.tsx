"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileText, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  received: "text-yellow-400 bg-yellow-400/10",
  reviewing: "text-blue-400 bg-blue-400/10",
  shortlisted: "text-green-400 bg-green-400/10",
  declined: "text-red-400 bg-red-400/10",
  accepted: "text-signal bg-signal/10",
};

const statusLabels: Record<string, string> = {
  received: "Received",
  reviewing: "Under Review",
  shortlisted: "Shortlisted",
  declined: "Declined",
  accepted: "Accepted",
};

const statusOptions = ["received", "reviewing", "shortlisted", "declined", "accepted"];

interface RFP {
  id: string;
  organization: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  deadline: string;
  scope_summary: string;
  evaluation_criteria: string;
  submission_requirements: string;
  document_url: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

interface RFPListResponse {
  rfps?: RFP[];
}

export default function AdminRFPsPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRFPs = useCallback(async () => {
    try {
      const res = (await api.listRFPSubmissionsAdmin(filter || undefined)) as RFPListResponse;
      setRfps(res.rfps || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void (async () => {
      await fetchRFPs();
    })();
  }, [fetchRFPs]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.updateRFPSubmissionAdmin(id, { status });
      await fetchRFPs();
    } catch {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return <div className="text-white/60">Loading RFPs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-signal" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">RFP Submissions</h1>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="portal-field-x"
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {rfps.length === 0 ? (
        <div className="portal-panel-x p-8 text-center text-white/40">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No RFP submissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rfps.map((rfp) => (
            <div key={rfp.id} className="portal-card-x overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === rfp.id ? null : rfp.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{rfp.organization}</p>
                    <p className="text-xs text-white/50">{rfp.contact_name} · {rfp.contact_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[rfp.status] || "text-white/50 bg-white/5"}`}>
                    {statusLabels[rfp.status] || rfp.status}
                  </span>
                  {expandedId === rfp.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
              </div>

              {expandedId === rfp.id && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Scope Summary</p>
                      <p className="text-sm text-white/70">{rfp.scope_summary}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Evaluation Criteria</p>
                      <p className="text-sm text-white/70">{rfp.evaluation_criteria || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Submission Requirements</p>
                      <p className="text-sm text-white/70">{rfp.submission_requirements || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Deadline</p>
                      <p className="text-sm text-white/70">{rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Contact Phone</p>
                      <p className="text-sm text-white/70">{rfp.contact_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Document</p>
                      {rfp.document_url ? (
                        <a href={rfp.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-signal hover:underline flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-white/70">—</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                    <span className="text-xs text-white/40">Update status:</span>
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(rfp.id, s)}
                        disabled={updating === rfp.id || rfp.status === s}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          rfp.status === s
                            ? statusColors[s]
                            : "border border-white/10 text-white/60 hover:border-signal hover:text-signal"
                        } disabled:opacity-50`}
                      >
                        {updating === rfp.id && rfp.status !== s ? "..." : statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
