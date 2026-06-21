"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { Flag, CheckCircle, Clock, Circle, Plus, Pencil, Trash2, X, Save, AlertTriangle } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Milestone {
  ID: string;
  Title: string;
  Description: string;
  DueDate: string | null;
  CompletedAt: string | null;
  Status: string;
  SortOrder: number;
}

interface MilestonesResponse {
  milestones?: Milestone[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  completed: { icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Completed" },
  in_progress: { icon: <Clock className="w-5 h-5" />, color: "text-signal bg-signal/10 border-signal/30", label: "In Progress" },
  upcoming: { icon: <Circle className="w-5 h-5" />, color: "text-white/40 bg-white/5 border-white/10", label: "Upcoming" },
};

const MILESTONE_STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function MilestonesPage() {
  const { id } = useParams();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", status: "upcoming", sortOrder: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = (await api.listMilestones(id as string)) as MilestonesResponse;
      setMilestones(d.milestones || []);
      setError("");
    } catch {
      setError("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const d = (await api.listMilestones(id as string)) as MilestonesResponse;
        if (cancelled) return;
        setMilestones(d.milestones || []);
        setError("");
      } catch {
        if (!cancelled) setError("Failed to load milestones");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const resetForm = () => {
    setForm({ title: "", description: "", dueDate: "", status: "upcoming", sortOrder: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.createMilestone(id as string, {
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.dueDate || undefined,
        status: form.status,
        sort_order: form.sortOrder,
      });
      resetForm();
      await load();
    } catch {
      setError("Failed to create milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !editingId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.updateMilestone(id as string, editingId, {
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.dueDate || undefined,
        status: form.status,
        sort_order: form.sortOrder,
      });
      resetForm();
      await load();
    } catch {
      setError("Failed to update milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (milestoneID: string) => {
    if (!id) return;
    setDeleteId(milestoneID);
    try {
      await api.deleteMilestone(id as string, milestoneID);
      await load();
    } catch {
      setError("Failed to delete milestone");
    } finally {
      setDeleteId(null);
    }
  };

  const startEdit = (m: Milestone) => {
    setForm({
      title: m.Title,
      description: m.Description,
      dueDate: m.DueDate ? m.DueDate.slice(0, 10) : "",
      status: m.Status,
      sortOrder: m.SortOrder,
    });
    setEditingId(m.ID);
    setShowForm(true);
  };

  if (error && !milestones.length)
    return (
      <PortalEmptyState
        icon={AlertTriangle}
        title="Could not load milestones"
        description={error}
        action={
          <button onClick={load} className="portal-btn-x">
            Retry
          </button>
        }
      />
    );
  if (loading) return <div className="text-white/60">Loading milestones...</div>;

  const completed = milestones.filter((m) => m.Status === "completed").length;
  const progress = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-signal" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Milestones</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-white/50">
            {completed} of {milestones.length} completed
          </div>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-signal rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-medium text-signal">{progress}%</span>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="portal-btn-x"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Milestone" : "New Milestone"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Milestone title"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <CustomSelect
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={MILESTONE_STATUS_OPTIONS}
                variant="portal"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="portal-field-x w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="portal-field-x w-full"
                rows={2}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={resetForm} className="portal-chip-x hover:border-signal hover:text-white">Cancel</button>
            <button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={submitting || !form.title.trim()}
              className="portal-btn-x disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {submitting ? "Saving..." : (editingId ? "Update" : "Create")}
            </button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <PortalEmptyState
          icon={Flag}
          title="No milestones yet"
          description="No milestones defined for this engagement. Add the first one to start tracking progress."
          action={
            <button onClick={() => { resetForm(); setShowForm(true); }} className="portal-btn-x">
              <Plus className="w-4 h-4" /> Add milestone
            </button>
          }
        />
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10" />

          {milestones.map((m) => {
            const cfg = statusConfig[m.Status] || statusConfig.upcoming;
            return (
              <div key={m.ID} className="relative flex items-start gap-4 py-4 group">
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${m.Status === "completed" ? "text-white/60 line-through" : ""}`}>
                      {m.Title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {m.Description && (
                    <p className="text-sm text-white/50 mt-1">{m.Description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-white/40">
                    {m.DueDate && (
                      <span>Due: {new Date(m.DueDate).toLocaleDateString()}</span>
                    )}
                    {m.CompletedAt && (
                      <span className="text-green-400">Completed: {new Date(m.CompletedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                  <button
                    onClick={() => startEdit(m)}
                    className="p-1.5 text-white/40 hover:text-signal hover:bg-white/5 rounded"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.ID)}
                    disabled={deleteId === m.ID}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
