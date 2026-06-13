"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileSignature, Send, CheckCircle, Clock, XCircle, Eye, Loader2, X, Download } from "lucide-react";

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

  async function fetchRequests() {
    try {
      const res = await api.listSignatureRequests(filter || undefined);
      setRequests(res.requests || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createSignatureRequest(form);
      setShowForm(false);
      setForm({ document_type: "nda", recipient_email: "", recipient_name: "", recipient_org: "", document_title: "", document_body: "" });
      await fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to create signature request");
    }
  }

  async function handleSend(id: string) {
    setSending(id);
    try {
      await api.sendSignatureRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to send");
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return <div className="text-white/60">Loading signature requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Signature Requests</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            {Object.keys(statusLabels).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "New Request"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-white/10 rounded-lg p-6 bg-foundation space-y-4">
          <h2 className="font-semibold">Create Signature Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <select
                value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                <option value="nda">NDA</option>
                <option value="mou">MoU</option>
                <option value="sow">Statement of Work</option>
                <option value="amendment">Amendment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Email *</label>
              <input
                type="email"
                required
                value={form.recipient_email}
                onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Name</label>
              <input
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organisation</label>
              <input
                value={form.recipient_org}
                onChange={(e) => setForm({ ...form, recipient_org: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Title *</label>
            <input
              required
              value={form.document_title}
              onChange={(e) => setForm({ ...form, document_title: e.target.value })}
              className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Body *</label>
            <textarea
              required
              value={form.document_body}
              onChange={(e) => setForm({ ...form, document_body: e.target.value })}
              rows={6}
              className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              placeholder="Paste the document text here..."
            />
          </div>
          <button
            type="submit"
            className="bg-signal text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Draft
          </button>
        </form>
      )}

      {requests.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No signature requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="border border-white/10 rounded-lg bg-foundation p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[req.status] || ""}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                    <span className="text-xs text-white/30 uppercase">{req.document_type}</span>
                  </div>
                  <p className="font-medium">{req.document_title}</p>
                  <p className="text-sm text-white/50">
                    {req.recipient_name || req.recipient_email} · {req.recipient_org || "No org"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "draft" && (
                    <button
                      onClick={() => handleSend(req.id)}
                      disabled={sending === req.id}
                      className="flex items-center gap-1 bg-signal text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
                      className="flex items-center gap-1 border border-white/10 text-white/60 px-3 py-1.5 rounded text-xs hover:border-signal hover:text-signal transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View
                    </a>
                  )}
                  {req.status === "signed" && (
                    <button
                      onClick={() => setViewing(req)}
                      className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1.5 rounded text-xs font-medium hover:bg-green-500/20 transition-colors"
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
          <div className="bg-gravity border border-white/10 rounded-lg max-w-lg w-full p-6">
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
                <div className="border border-white/10 rounded p-4 bg-white/5">
                  <p className="text-sm text-white/70 font-mono">{viewing.signed_document_url}</p>
                </div>
              )}
              <a
                href={viewing.signed_document_url}
                download={`${viewing.document_title}_signed.png`}
                className="flex items-center justify-center gap-2 w-full bg-white/5 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-white/10 transition-colors"
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
