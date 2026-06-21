"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
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
const RFP_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  ...statusOptions.map((value) => ({ value, label: statusLabels[value] })),
];

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
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="portal-skeleton-x h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Intake</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">RFP submissions</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Review tender requests, requirements, deadlines, documents, and the evaluation status for incoming opportunities.
              </p>
            </div>
          </div>
          <CustomSelect value={filter} onChange={setFilter} options={RFP_FILTER_OPTIONS} variant="portal" className="sm:w-48" />
        </div>
      </section>

      {rfps.length === 0 ? (
        <div className="portal-panel-x p-8 text-center text-white/40">
          <Clock className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <h2 className="font-display text-xl font-semibold text-white/72">No RFP submissions found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">New submitted RFPs will appear here with their scope, criteria, requirements, and document link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rfps.map((rfp) => (
            <div key={rfp.id} className="portal-card-x overflow-hidden">
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setExpandedId(expandedId === rfp.id ? null : rfp.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{rfp.organization}</p>
                    <p className="text-xs text-white/50">{rfp.contact_name} · {rfp.contact_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`portal-chip-x ${statusColors[rfp.status] || "text-white/50 bg-white/5"}`}>
                    {statusLabels[rfp.status] || rfp.status}
                  </span>
                  {expandedId === rfp.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
              </button>

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

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
                    <span className="text-xs text-white/40">Update status:</span>
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(rfp.id, s)}
                        disabled={updating === rfp.id || rfp.status === s}
                        className={`portal-admin-action-x ${
                          rfp.status === s
                            ? statusColors[s]
                            : ""
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
