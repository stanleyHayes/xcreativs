"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Network, Plus, Pencil, Trash2, X, Save } from "lucide-react";

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  influence: string;
  interest: string;
  sentiment: string;
  notes: string;
}

interface StakeholdersResponse {
  stakeholders?: Stakeholder[];
}

const sentimentColor: Record<string, string> = {
  supporter: "border-green-400/40 bg-green-400/10",
  neutral: "border-white/15 bg-white/[0.04]",
  skeptic: "border-yellow-400/40 bg-yellow-400/10",
  blocker: "border-red-400/40 bg-red-400/10",
};

const levels = ["high", "medium", "low"]; // rows top→bottom (influence) and cols left→right (interest) reversed

const quadrantLabel = (influence: string, interest: string) => {
  const hi = (v: string) => v === "high";
  if (hi(influence) && hi(interest)) return "Manage closely";
  if (hi(influence)) return "Keep satisfied";
  if (hi(interest)) return "Keep informed";
  return "Monitor";
};

const emptyForm = { name: "", role: "", organization: "", influence: "medium", interest: "medium", sentiment: "neutral", notes: "" };

export default function StakeholdersPage() {
  const { id } = useParams();
  const [items, setItems] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = (await api.listStakeholders(id as string)) as StakeholdersResponse;
      setItems(d.stakeholders || []);
      setError("");
    } catch {
      setError("Failed to load stakeholders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const d = (await api.listStakeholders(id as string)) as StakeholdersResponse;
        if (!active) return;
        setItems(d.stakeholders || []);
        setError("");
      } catch {
        if (active) setError("Failed to load stakeholders");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const resetForm = () => { setForm({ ...emptyForm }); setShowForm(false); setEditingId(null); };

  const submit = async () => {
    if (!id || !form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) await api.updateStakeholder(id as string, editingId, { ...form, name: form.name.trim() });
      else await api.createStakeholder(id as string, { ...form, name: form.name.trim() });
      resetForm();
      await load();
    } catch {
      setError("Failed to save stakeholder");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (sid: string) => {
    if (!id) return;
    try { await api.deleteStakeholder(id as string, sid); await load(); } catch { setError("Failed to delete"); }
  };

  const startEdit = (s: Stakeholder) => {
    setForm({ name: s.name, role: s.role, organization: s.organization, influence: s.influence, interest: s.interest, sentiment: s.sentiment, notes: s.notes });
    setEditingId(s.id);
    setShowForm(true);
  };

  if (error && !items.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  const cell = (influence: string, interest: string) => items.filter((s) => s.influence === influence && s.interest === interest);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Network className="w-5 h-5 text-signal" /> Stakeholder Map</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 transition">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {showForm && (
        <div className="border border-white/10 rounded-lg p-4 mb-6 bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{editingId ? "Edit Stakeholder" : "New Stakeholder"}</h3>
            <button onClick={resetForm} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" placeholder="Stakeholder name" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" placeholder="e.g. Sponsor" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Organization</label>
              <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" placeholder="Organization" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Influence</label>
              <select value={form.influence} onChange={(e) => setForm({ ...form, influence: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Interest</label>
              <select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Sentiment</label>
              <select value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="supporter">Supporter</option><option value="neutral">Neutral</option><option value="skeptic">Skeptic</option><option value="blocker">Blocker</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs text-white/50 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" rows={2} placeholder="Context, engagement strategy..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 text-sm border border-white/10 rounded-md hover:bg-white/5">Cancel</button>
            <button onClick={submit} disabled={submitting || !form.name.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 disabled:opacity-50">
              <Save className="w-4 h-4" /> {submitting ? "Saving..." : (editingId ? "Update" : "Create")}
            </button>
          </div>
        </div>
      )}

      {/* Power / Interest grid */}
      <div className="mb-2 text-xs text-white/40 text-center">Interest →</div>
      <div className="flex gap-2">
        <div className="flex items-center"><span className="text-xs text-white/40 -rotate-90 whitespace-nowrap">Influence →</span></div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          {levels.map((inf) =>
            ["low", "medium", "high"].map((intr) => {
              const cards = cell(inf, intr);
              return (
                <div key={`${inf}-${intr}`} className="min-h-[120px] border border-white/10 rounded-lg p-2 bg-white/[0.02]">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{quadrantLabel(inf, intr)}</p>
                  <div className="space-y-1.5">
                    {cards.map((s) => (
                      <div key={s.id} className={`group border rounded px-2 py-1.5 text-xs ${sentimentColor[s.sentiment] || sentimentColor.neutral}`}>
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium truncate">{s.name}</span>
                          <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => startEdit(s)} className="text-white/40 hover:text-signal" title="Edit"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => remove(s.id)} className="text-white/40 hover:text-red-400" title="Delete"><Trash2 className="w-3 h-3" /></button>
                          </span>
                        </div>
                        {(s.role || s.organization) && <p className="text-white/40 truncate">{[s.role, s.organization].filter(Boolean).join(" · ")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {items.length === 0 && <p className="text-center text-white/30 py-8 text-sm">No stakeholders mapped yet.</p>}
    </div>
  );
}
