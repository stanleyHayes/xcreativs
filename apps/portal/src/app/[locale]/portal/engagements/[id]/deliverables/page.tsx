"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileUpload } from "@xc/ui/FileUpload";
import { FileText, CheckCircle, XCircle, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import ThreadedComments from "@/components/portal/ThreadedComments";

interface Deliverable {
  ID: string;
  Title: string;
  Description: string;
  Version: number;
  FileURL: string;
  FileName: string;
  Status: string;
  VisibilityRole: string;
  SignatureStatus: string;
}

interface DeliverablesResponse {
  deliverables?: Deliverable[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "text-white/60 bg-white/5 border-white/10", label: "Draft" },
  review: { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "Review" },
  approved: { color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Approved" },
  delivered: { color: "text-signal bg-signal/10 border-signal/30", label: "Delivered" },
  archived: { color: "text-white/30 bg-white/5 border-white/10", label: "Archived" },
};

export default function DeliverablesPage() {
  const { id } = useParams();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", version: 1, file_url: "", file_name: "", mime_type: "", visibility_role: "viewer", status: "draft" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = (await api.listDeliverables(id as string)) as DeliverablesResponse;
      setDeliverables(d.deliverables || []);
      setError("");
    } catch {
      setError("Failed to load deliverables");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const d = (await api.listDeliverables(id as string)) as DeliverablesResponse;
        if (!active) return;
        setDeliverables(d.deliverables || []);
        setError("");
      } catch {
        if (active) setError("Failed to load deliverables");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const resetForm = () => {
    setForm({ title: "", description: "", version: 1, file_url: "", file_name: "", mime_type: "", visibility_role: "viewer", status: "draft" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.createDeliverable(id as string, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to create deliverable");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !editingId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.updateDeliverable(id as string, editingId, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to update deliverable");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (did: string) => {
    if (!id) return;
    setDeleteId(did);
    try {
      await api.deleteDeliverable(id as string, did);
      await load();
    } catch {
      setError("Failed to delete deliverable");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (d: Deliverable) => {
    setForm({
      title: d.Title,
      description: d.Description,
      version: d.Version,
      file_url: d.FileURL,
      file_name: d.FileName,
      mime_type: "",
      visibility_role: d.VisibilityRole,
      status: d.Status,
    });
    setEditingId(d.ID);
    setShowForm(true);
  };

  if (error && !deliverables.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Deliverables Vault</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="portal-btn-x"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Deliverable" : "New Deliverable"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="portal-field-x w-full" placeholder="Deliverable title" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">File</label>
              <FileUpload
                value={form.file_url}
                onChange={(url, name) => setForm({ ...form, file_url: url, file_name: form.file_name || name || "" })}
                folder="deliverables"
                label="Upload deliverable"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="portal-field-x w-full">
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Visibility</label>
              <select value={form.visibility_role} onChange={(e) => setForm({ ...form, visibility_role: e.target.value })} className="portal-field-x w-full">
                <option value="viewer">Viewer</option>
                <option value="project">Project</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Version</label>
              <input type="number" value={form.version} onChange={(e) => setForm({ ...form, version: Number(e.target.value) })} className="portal-field-x w-full" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">File Name</label>
              <input value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} className="portal-field-x w-full" placeholder="filename.pdf" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="Optional description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={resetForm} className="portal-chip-x hover:border-signal hover:text-white">Cancel</button>
            <button onClick={editingId ? handleUpdate : handleCreate} disabled={submitting || !form.title.trim()} className="portal-btn-x disabled:opacity-50">
              <Save className="w-4 h-4" /> {submitting ? "Saving..." : (editingId ? "Update" : "Create")}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {deliverables.map((d) => {
          const cfg = statusConfig[d.Status] || statusConfig.draft;
          return (
            <div key={d.ID} className="portal-card-x group flex items-start gap-4 p-4 transition-colors hover:border-signal/50">
              <FileText className="w-5 h-5 text-signal shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{d.Title}</h3>
                  {d.SignatureStatus === "signed" ? <CheckCircle className="w-4 h-4 text-signal" /> : <XCircle className="w-4 h-4 text-white/30" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-sm text-white/50 mt-1">{d.Description}</p>
                <div className="flex gap-3 mt-2 text-xs text-white/40">
                  <span>v{d.Version}</span>
                  <span className="capitalize">{d.VisibilityRole} visibility</span>
                  {d.FileName && <span>{d.FileName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(d)} className="p-1.5 text-white/40 hover:text-signal hover:bg-white/5 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(d.ID)} disabled={deleteId === d.ID} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
              {d.FileURL && (
                <a href={d.FileURL} target="_blank" rel="noopener noreferrer" className="text-sm text-signal hover:underline shrink-0">
                  Download
                </a>
              )}
            </div>
          );
        })}
      </div>
      <ThreadedComments engagementID={id as string} parentType="deliverables" parentID={id as string} />
    </div>
  );
}
