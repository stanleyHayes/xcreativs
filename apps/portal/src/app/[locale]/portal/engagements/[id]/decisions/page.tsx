"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { Scale, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import ThreadedComments from "@/components/portal/ThreadedComments";

interface Decision {
  ID: string;
  Title: string;
  Description: string;
  Rationale: string;
  AlternativesConsidered: string;
  Status: string;
  DecidedAt: string | null;
}

interface DecisionsListResult {
  decisions?: Decision[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  proposed: { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "Proposed" },
  approved: { color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Approved" },
  rejected: { color: "text-red-400 bg-red-400/10 border-red-400/30", label: "Rejected" },
  superseded: { color: "text-white/30 bg-white/5 border-white/10", label: "Superseded" },
};

const DECISION_STATUS_OPTIONS = [
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "superseded", label: "Superseded" },
];

export default function DecisionsPage() {
  const { id } = useParams();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", rationale: "", alternatives_considered: "", status: "proposed" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = (await api.listDecisions(id as string)) as DecisionsListResult;
      setDecisions(d.decisions || []);
      setError("");
    } catch {
      setError("Failed to load decisions");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .listDecisions(id as string)
      .then((d) => {
        if (!active) return;
        const result = d as DecisionsListResult;
        setDecisions(result.decisions || []);
        setError("");
      })
      .catch(() => {
        if (active) setError("Failed to load decisions");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const resetForm = () => {
    setForm({ title: "", description: "", rationale: "", alternatives_considered: "", status: "proposed" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.createDecision(id as string, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to create decision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !editingId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.updateDecision(id as string, editingId, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to update decision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (did: string) => {
    if (!id) return;
    setDeleteId(did);
    try {
      await api.deleteDecision(id as string, did);
      await load();
    } catch {
      setError("Failed to delete decision");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (d: Decision) => {
    setForm({ title: d.Title, description: d.Description, rationale: d.Rationale, alternatives_considered: d.AlternativesConsidered, status: d.Status });
    setEditingId(d.ID);
    setShowForm(true);
  };

  if (error && !decisions.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Decision Log</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="portal-btn-x">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Decision" : "New Decision"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="portal-field-x w-full" placeholder="Decision title" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <CustomSelect value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={DECISION_STATUS_OPTIONS} variant="portal" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="What is being decided?" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Rationale</label>
              <textarea value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="Why this decision?" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Alternatives Considered</label>
              <textarea value={form.alternatives_considered} onChange={(e) => setForm({ ...form, alternatives_considered: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="What else was considered?" />
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

      <div className="space-y-4">
        {decisions.map((d) => {
          const cfg = statusConfig[d.Status] || statusConfig.proposed;
          return (
            <div key={d.ID} className="portal-card-x group p-5 transition-colors hover:border-signal/50">
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-signal shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{d.Title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">{d.Description}</p>
                  {d.Rationale && (
                    <div className="mt-3 p-3 bg-white/5 rounded text-sm">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Rationale</p>
                      <p className="text-white/70">{d.Rationale}</p>
                    </div>
                  )}
                  {d.AlternativesConsidered && (
                    <div className="mt-2 text-sm text-white/40">Alternatives: {d.AlternativesConsidered}</div>
                  )}
                  <div className="flex gap-3 mt-3 text-xs text-white/40">
                    {d.DecidedAt && <span>Decided: {new Date(d.DecidedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(d)} className="p-1.5 text-white/40 hover:text-signal hover:bg-white/5 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(d.ID)} disabled={deleteId === d.ID} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ThreadedComments engagementID={id as string} parentType="decisions" parentID={id as string} />
    </div>
  );
}
