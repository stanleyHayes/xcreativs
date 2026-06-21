"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { AlertTriangle, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import ThreadedComments from "@/components/portal/ThreadedComments";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Risk {
  ID: string;
  Title: string;
  Description: string;
  MitigationPlan: string;
  ResidualRating: string;
  Severity: string;
  EscalationStatus: string;
  Status: string;
}

interface RisksResponse {
  risks?: Risk[];
}

const severityColor = (s: string) => {
  if (s === "critical") return "text-red-500";
  if (s === "high") return "text-red-400";
  if (s === "medium") return "text-yellow-400";
  return "text-green-400";
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "text-red-400 bg-red-400/10 border-red-400/30", label: "Open" },
  mitigated: { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "Mitigated" },
  accepted: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", label: "Accepted" },
  closed: { color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Closed" },
};

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const RISK_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "mitigated", label: "Mitigated" },
  { value: "accepted", label: "Accepted" },
  { value: "closed", label: "Closed" },
];

const ESCALATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "watch", label: "Watch" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

export default function RisksPage() {
  const { id } = useParams();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", mitigation_plan: "", residual_rating: "", severity: "medium", escalation_status: "none", status: "open", linked_decision_id: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = (await api.listRisks(id as string)) as RisksResponse;
      setRisks(d.risks || []);
      setError("");
    } catch {
      setError("Failed to load risks");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [id, load]);

  const resetForm = () => {
    setForm({ title: "", description: "", mitigation_plan: "", residual_rating: "", severity: "medium", escalation_status: "none", status: "open", linked_decision_id: null });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.createRisk(id as string, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to create risk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !editingId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.updateRisk(id as string, editingId, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to update risk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rid: string) => {
    if (!id) return;
    setDeleteId(rid);
    try {
      await api.deleteRisk(id as string, rid);
      await load();
    } catch {
      setError("Failed to delete risk");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (r: Risk) => {
    setForm({ title: r.Title, description: r.Description, mitigation_plan: r.MitigationPlan, residual_rating: r.ResidualRating, severity: r.Severity, escalation_status: r.EscalationStatus, status: r.Status, linked_decision_id: null });
    setEditingId(r.ID);
    setShowForm(true);
  };

  if (error && !risks.length)
    return (
      <PortalEmptyState
        icon={AlertTriangle}
        title="Could not load risks"
        description={error}
        action={
          <button onClick={() => void load()} className="portal-btn-x">
            Retry
          </button>
        }
      />
    );
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Risk Register</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="portal-btn-x">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Risk" : "New Risk"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="portal-field-x w-full" placeholder="Risk title" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Severity</label>
              <CustomSelect value={form.severity} onChange={(value) => setForm({ ...form, severity: value })} options={SEVERITY_OPTIONS} variant="portal" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <CustomSelect value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={RISK_STATUS_OPTIONS} variant="portal" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Escalation</label>
              <CustomSelect value={form.escalation_status} onChange={(value) => setForm({ ...form, escalation_status: value })} options={ESCALATION_OPTIONS} variant="portal" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="Risk description" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Mitigation Plan</label>
              <textarea value={form.mitigation_plan} onChange={(e) => setForm({ ...form, mitigation_plan: e.target.value })} className="portal-field-x w-full" rows={2} placeholder="How will this be mitigated?" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Residual Rating</label>
              <input value={form.residual_rating} onChange={(e) => setForm({ ...form, residual_rating: e.target.value })} className="portal-field-x w-full" placeholder="e.g. medium, low" />
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
        {risks.map((r) => {
          const cfg = statusConfig[r.Status] || statusConfig.open;
          return (
            <div key={r.ID} className="portal-card-x group p-5 transition-colors hover:border-signal/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${severityColor(r.Severity)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-medium">{r.Title}</h3>
                    <span className={`text-xs font-medium uppercase ${severityColor(r.Severity)}`}>{r.Severity}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">{r.Description}</p>
                  {r.MitigationPlan && (
                    <div className="mt-3 p-3 bg-white/5 rounded text-sm">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Mitigation</p>
                      <p className="text-white/70">{r.MitigationPlan}</p>
                    </div>
                  )}
                  <div className="flex gap-3 mt-3 text-xs text-white/40">
                    {r.ResidualRating && <span>Residual: {r.ResidualRating}</span>}
                    {r.EscalationStatus !== "none" && <span>Escalation: {r.EscalationStatus}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(r)} className="p-1.5 text-white/40 hover:text-signal hover:bg-white/5 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.ID)} disabled={deleteId === r.ID} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ThreadedComments engagementID={id as string} parentType="risks" parentID={id as string} />
    </div>
  );
}
