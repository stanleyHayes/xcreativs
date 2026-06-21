"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { FileSignature, Send, CheckCircle, Clock, XCircle, Eye, Loader2, X, Download } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

const statusColors: Record<string, string> = {
  draft: "text-white/50 bg-white/5",
  sent: "text-blue-400 bg-blue-400/10",
  viewed: "text-yellow-400 bg-yellow-400/10",
  signed: "text-green-400 bg-green-400/10",
  declined: "text-red-400 bg-red-400/10",
  expired: "text-white/30 bg-white/5",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  declined: "Declined",
  expired: "Expired",
};

const SIGNATURE_STATUS_OPTIONS = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));
const SIGNATURE_FILTER_OPTIONS = [{ value: "", label: "All statuses" }, ...SIGNATURE_STATUS_OPTIONS];
const DOCUMENT_TYPE_OPTIONS = [
  { value: "nda", label: "NDA" },
  { value: "mou", label: "MoU" },
  { value: "sow", label: "Statement of Work" },
  { value: "amendment", label: "Amendment" },
];

interface SignatureRequest {
  id: string;
  document_type: string;
  recipient_email: string;
  recipient_name: string;
  recipient_org: string;
  document_title: string;
  status: string;
  signing_url: string;
  signed_document_url: string;
  signed_at: string;
  created_at: string;
  expires_at: string;
}

interface SignatureRequestsResponse {
  requests?: SignatureRequest[];
}

export default function AdminSignaturesPage() {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [viewing, setViewing] = useState<SignatureRequest | null>(null);

  const [form, setForm] = useState({
    document_type: "nda",
    recipient_email: "",
    recipient_name: "",
    recipient_org: "",
    document_title: "",
    document_body: "",
  });

  const fetchRequests = useCallback(async () => {
    try {
      const res = (await api.listSignatureRequests(
        filter || undefined,
      )) as SignatureRequestsResponse;
      setRequests(res.requests || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let active = true;
    void api
      .listSignatureRequests(filter || undefined)
      .then((res) => {
        if (!active) return;
        setRequests((res as SignatureRequestsResponse).requests || []);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createSignatureRequest(form);
      setShowForm(false);
      setForm({ document_type: "nda", recipient_email: "", recipient_name: "", recipient_org: "", document_title: "", document_body: "" });
      await fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create signature request");
    }
  }

  async function handleSend(id: string) {
    setSending(id);
    try {
      await api.sendSignatureRequest(id);
      await fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(null);
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <FileSignature className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Documents</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Signature requests</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Draft, send, inspect, and download signature requests for NDAs, MoUs, statements of work, and amendments.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CustomSelect value={filter} onChange={setFilter} options={SIGNATURE_FILTER_OPTIONS} variant="portal" className="sm:w-44" />
            <button onClick={() => setShowForm((s) => !s)} className="portal-btn-x">
              {showForm ? "Close form" : "New request"}
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleCreate} className="portal-panel-x space-y-4 p-6">
          <div>
            <p className="portal-meta-x">New signature packet</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">Create signature request</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <CustomSelect
                value={form.document_type}
                onChange={(value) => setForm({ ...form, document_type: value })}
                options={DOCUMENT_TYPE_OPTIONS}
                variant="portal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Email *</label>
              <input
                type="email"
                required
                value={form.recipient_email}
                onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Name</label>
              <input
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organisation</label>
              <input
                value={form.recipient_org}
                onChange={(e) => setForm({ ...form, recipient_org: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Title *</label>
            <input
              required
              value={form.document_title}
              onChange={(e) => setForm({ ...form, document_title: e.target.value })}
              className="portal-field-x w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Body *</label>
            <textarea
              required
              value={form.document_body}
              onChange={(e) => setForm({ ...form, document_body: e.target.value })}
              rows={6}
              className="portal-field-x w-full"
              placeholder="Paste the document text here..."
            />
          </div>
          <button
            type="submit"
            className="portal-btn-x"
          >
            Create Draft
          </button>
        </form>
      )}

      {requests.length === 0 ? (
        <PortalEmptyState
          icon={Clock}
          title="No signature requests yet"
          description="Create a draft request to send documents for review and signature."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`portal-chip-x ${statusColors[req.status] || ""}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                    <span className="text-xs text-white/30 uppercase">{req.document_type}</span>
                  </div>
                  <p className="font-display text-xl font-semibold">{req.document_title}</p>
                  <p className="text-sm text-white/50">
                    {req.recipient_name || req.recipient_email} · {req.recipient_org || "No org"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {req.status === "draft" && (
                    <button
                      onClick={() => handleSend(req.id)}
                      disabled={sending === req.id}
                      className="portal-btn-x disabled:opacity-50"
                    >
                      {sending === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                  )}
                  {req.status === "sent" && req.signing_url && (
                    <a
                      href={req.signing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portal-btn-secondary-x"
                    >
                      <Eye className="w-3 h-3" /> View
                    </a>
                  )}
                  {req.status === "signed" && (
                    <button
                      onClick={() => setViewing(req)}
                      className="portal-admin-action-x border-green-400/30 bg-green-400/15 text-green-300 hover:bg-green-400/25"
                    >
                      <CheckCircle className="w-3 h-3" /> View Signature
                    </button>
                  )}
                  {req.status === "declined" && (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <XCircle className="w-3 h-3" /> Declined
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-white/30">
                Created {new Date(req.created_at).toLocaleDateString()}
                {req.expires_at && ` · Expires ${new Date(req.expires_at).toLocaleDateString()}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* View Signature Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="portal-panel-x max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Signed Document</h3>
              <button onClick={() => setViewing(null)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Signed by <strong>{viewing.recipient_name || viewing.recipient_email}</strong></span>
              </div>
              {viewing.signed_at && (
                <p className="text-xs text-white/50">
                  {new Date(viewing.signed_at).toLocaleString()}
                </p>
              )}
              {viewing.signed_document_url?.startsWith("data:") ? (
                <img
                  src={viewing.signed_document_url}
                  alt="Signature"
                  className="w-full bg-white rounded border border-white/10"
                />
              ) : (
                <div className="portal-card-x p-4">
                  <p className="text-sm text-white/70 font-mono">{viewing.signed_document_url}</p>
                </div>
              )}
              <a
                href={viewing.signed_document_url}
                download={`${viewing.document_title}_signed.png`}
                className="portal-btn-secondary-x w-full"
              >
                <Download className="w-4 h-4" />
                Download Signature
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
