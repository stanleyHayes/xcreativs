"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Ticket, Clock, AlertCircle, CheckCircle, Plus, Pencil, Trash2, X, Save } from "lucide-react";

interface SupportTicket {
  ID: string;
  Title: string;
  Description: string;
  Status: string;
  Priority: string;
  SLATargetHours: number | null;
  ResolvedAt: string | null;
}

const priorityColor = (p: string) => {
  if (p === "high") return "text-red-400 bg-red-400/10";
  if (p === "medium") return "text-yellow-400 bg-yellow-400/10";
  return "text-green-400 bg-green-400/10";
};

const statusIcon = (s: string) => {
  if (s === "resolved" || s === "closed") return <CheckCircle className="w-4 h-4 text-signal" />;
  if (s === "in_progress") return <Clock className="w-4 h-4 text-yellow-400" />;
  return <AlertCircle className="w-4 h-4 text-white/30" />;
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "text-white/60 bg-white/5 border-white/10", label: "Open" },
  in_progress: { color: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "In Progress" },
  resolved: { color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Resolved" },
  closed: { color: "text-white/30 bg-white/5 border-white/10", label: "Closed" },
};

export default function TicketsPage() {
  const { id } = useParams();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", sla_target_hours: 48, status: "open" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.listSupportTickets(id as string);
      setTickets(d.tickets || []);
      setError("");
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const resetForm = () => {
    setForm({ title: "", description: "", priority: "medium", sla_target_hours: 48, status: "open" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.createSupportTicket(id as string, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !editingId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.updateSupportTicket(id as string, editingId, { ...form, title: form.title.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to update ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tid: string) => {
    if (!id) return;
    setDeleteId(tid);
    try {
      await api.deleteSupportTicket(id as string, tid);
      await load();
    } catch {
      setError("Failed to delete ticket");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (t: SupportTicket) => {
    setForm({ title: t.Title, description: t.Description, priority: t.Priority, sla_target_hours: t.SLATargetHours || 48, status: t.Status });
    setEditingId(t.ID);
    setShowForm(true);
  };

  if (error && !tickets.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-signal" />
          <h2 className="text-lg font-semibold">Support Tickets</h2>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 transition">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {showForm && (
        <div className="border border-white/10 rounded-lg p-4 mb-6 bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Ticket" : "New Ticket"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" placeholder="Ticket title" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">SLA Target (hours)</label>
              <input type="number" value={form.sla_target_hours} onChange={(e) => setForm({ ...form, sla_target_hours: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" rows={3} placeholder="Describe the issue or request..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 text-sm border border-white/10 rounded-md hover:bg-white/5">Cancel</button>
            <button onClick={editingId ? handleUpdate : handleCreate} disabled={submitting || !form.title.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 disabled:opacity-50">
              <Save className="w-4 h-4" /> {submitting ? "Saving..." : (editingId ? "Update" : "Create")}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((t) => {
          const cfg = statusConfig[t.Status] || statusConfig.open;
          return (
            <div key={t.ID} className="border border-white/10 rounded-lg p-4 hover:border-signal/50 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {statusIcon(t.Status)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{t.Title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${priorityColor(t.Priority)}`}>{t.Priority}</span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">{t.Description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-white/40">
                      {t.SLATargetHours && <span>SLA: {t.SLATargetHours}h</span>}
                      {t.ResolvedAt && <span className="text-green-400">Resolved: {new Date(t.ResolvedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(t)} className="p-1.5 text-white/40 hover:text-signal hover:bg-white/5 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(t.ID)} disabled={deleteId === t.ID} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
