"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";

interface ApprovalWorkflow {
  ID: string;
  Title: string;
  Status: string;
  RequestedAt: string;
  RespondedAt?: string;
  Comments?: string;
  RejectedReason?: string;
}

export default function ApprovalsPage() {
  const { id } = useParams();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .listApprovalWorkflows(id as string)
      .then((res) => {
        if (cancelled) return;
        setWorkflows((res.workflows as unknown as ApprovalWorkflow[]) || []);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load approval workflows");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  function reloadWorkflows() {
    setReloadToken((t) => t + 1);
  }

  async function handleAction(workflowID: string, status: string) {
    try {
      await api.updateApprovalWorkflow(workflowID, {
        status,
        comments: comment,
        rejected_reason: status === "rejected" ? comment : "",
      });
      setActionId(null);
      setComment("");
      reloadWorkflows();
    } catch {
      // ignore
    }
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
    approved: { icon: <CheckCircle className="w-4 h-4" />, color: "text-signal", label: "Approved", bg: "bg-signal/10" },
    rejected: { icon: <XCircle className="w-4 h-4" />, color: "text-red-400", label: "Rejected", bg: "bg-red-400/10" },
    pending: { icon: <Clock className="w-4 h-4" />, color: "text-yellow-400", label: "Pending", bg: "bg-yellow-400/10" },
  };

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Approval Workflows</h2>
      <p className="text-sm text-white/50 mb-6">Deliverables sent for sign-off with full audit trail.</p>

      <div className="space-y-4">
        {workflows.map((w) => {
          const config = statusConfig[w.Status] || statusConfig.pending;
          return (
            <div key={w.ID} className="portal-card-x p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded ${config.bg} ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{w.Title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span className={`px-2 py-0.5 rounded uppercase font-medium ${config.color} ${config.bg}`}>
                        {config.label}
                      </span>
                      <span>Requested {new Date(w.RequestedAt).toLocaleDateString()}</span>
                      {w.RespondedAt && (
                        <span>Responded {new Date(w.RespondedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {w.Comments && (
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />
                        <p className="text-white/60">{w.Comments}</p>
                      </div>
                    )}
                    {w.RejectedReason && (
                      <div className="mt-2 p-2 bg-red-400/5 border border-red-400/10 rounded text-sm text-red-400/80">
                        <span className="font-medium">Reason:</span> {w.RejectedReason}
                      </div>
                    )}
                  </div>
                </div>

                {w.Status === "pending" && (
                  <div className="flex gap-2">
                    {actionId === w.ID ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="portal-field-x w-48"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAction(w.ID, "approved")}
                          className="portal-btn-x"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(w.ID, "rejected")}
                          className="text-xs bg-red-400/20 text-red-400 px-3 py-1.5 rounded font-medium hover:bg-red-400/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => { setActionId(null); setComment(""); }}
                          className="text-xs text-white/40 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActionId(w.ID)}
                        className="text-xs bg-white/5 text-white/60 px-3 py-1.5 rounded font-medium hover:bg-white/10"
                      >
                        Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {workflows.length === 0 && (
          <div className="portal-panel-x p-8 text-center">
            <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No approval workflows yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
