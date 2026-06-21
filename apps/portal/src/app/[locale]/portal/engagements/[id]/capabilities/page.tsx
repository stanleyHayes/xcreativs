"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { Layers, Plus, Trash2, X } from "lucide-react";

interface Capability {
  ID: string;
  CapabilityName: string;
  Status: string;
  ReasonDeferred: string;
  SortOrder: number;
}

const columns = [
  { key: "queued", label: "Queued", color: "border-white/15" },
  { key: "in_flight", label: "In-Flight", color: "border-blue-400/40" },
  { key: "delivered", label: "Delivered", color: "border-green-400/40" },
  { key: "deferred", label: "Deferred", color: "border-yellow-400/40" },
];
const CAPABILITY_STATUS_OPTIONS = columns.map((column) => ({ value: column.key, label: column.label }));
const nextStatus: Record<string, string> = { queued: "in_flight", in_flight: "delivered", delivered: "deferred", deferred: "queued" };
const nextLabel: Record<string, string> = { queued: "In-Flight", in_flight: "Delivered", delivered: "Deferred", deferred: "Queued" };

export default function CapabilitiesPage() {
  const { id } = useParams();
  const [items, setItems] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ capability_name: "", status: "queued", reason_deferred: "" });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.listCapabilityDeliveries(id as string);
      setItems((d.capability_deliveries as unknown as Capability[]) || []);
      setError("");
    } catch { setError("Failed to load capabilities"); } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!id) return;
    let active = true;
    void (async () => {
      try {
        const d = await api.listCapabilityDeliveries(id as string);
        if (!active) return;
        setItems((d.capability_deliveries as unknown as Capability[]) || []);
        setError("");
      } catch {
        if (active) setError("Failed to load capabilities");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const create = async () => {
    if (!id || !form.capability_name.trim()) return;
    try { await api.createCapability(id as string, form); setForm({ capability_name: "", status: "queued", reason_deferred: "" }); setShowForm(false); await load(); }
    catch { setError("Failed to create"); }
  };
  const advance = async (c: Capability) => {
    if (!id) return;
    try { await api.updateCapability(id as string, c.ID, { status: nextStatus[c.Status] || "queued" }); await load(); } catch { setError("Failed to update"); }
  };
  const remove = async (cid: string) => {
    if (!id) return;
    try { await api.deleteCapability(id as string, cid); await load(); } catch { setError("Failed to delete"); }
  };

  if (error && !items.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"><Layers className="w-5 h-5 text-signal" /> Capability Lattice</h2>
        <button onClick={() => setShowForm(!showForm)} className="portal-btn-x"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">New Capability</h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.capability_name} onChange={(e) => setForm({ ...form, capability_name: e.target.value })} placeholder="Capability name" className="md:col-span-2 portal-field-x" />
            <CustomSelect value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={CAPABILITY_STATUS_OPTIONS} variant="portal" />
            {form.status === "deferred" && (
              <input value={form.reason_deferred} onChange={(e) => setForm({ ...form, reason_deferred: e.target.value })} placeholder="Reason deferred" className="md:col-span-3 portal-field-x" />
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={create} disabled={!form.capability_name.trim()} className="portal-btn-x disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.key} className={`border ${col.color} rounded-lg p-3 bg-white/[0.02] min-h-[140px]`}>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center justify-between">
              {col.label} <span>{items.filter((i) => i.Status === col.key).length}</span>
            </p>
            <div className="space-y-2">
              {items.filter((i) => i.Status === col.key).map((c) => (
                <div key={c.ID} className="portal-card-x group px-2.5 py-2 text-sm">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-medium">{c.CapabilityName}</span>
                    <span className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => advance(c)} className="text-[10px] text-signal hover:underline" title="Advance status">→ {nextLabel[c.Status] || "Queued"}</button>
                      <button onClick={() => remove(c.ID)} className="text-white/40 hover:text-red-400" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  </div>
                  {c.Status === "deferred" && c.ReasonDeferred && <p className="text-xs text-white/40 mt-1">{c.ReasonDeferred}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-center text-white/30 py-8 text-sm">No capabilities tracked yet.</p>}
    </div>
  );
}
