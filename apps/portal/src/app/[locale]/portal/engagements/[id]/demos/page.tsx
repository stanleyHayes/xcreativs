"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { MonitorPlay, Plus, X, ExternalLink, Ban, Copy, AlertTriangle } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Demo {
  id: string;
  label: string;
  target_url: string;
  access_url: string;
  expires_at: string | null;
  access_count: number;
  is_revoked: boolean;
}

export default function DemosPage() {
  const { id } = useParams();
  const [items, setItems] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", target_url: "", expires_in_hours: 48 });

  const load = async () => {
    if (!id) return;
    try { const d = await api.listDemos(id as string); setItems((d.demos as Demo[] | undefined) || []); setError(""); }
    catch { setError("Failed to load demos"); } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!id) return;
    let active = true;
    api.listDemos(id as string)
      .then((d) => { if (active) { setItems((d.demos as Demo[] | undefined) || []); setError(""); } })
      .catch(() => { if (active) setError("Failed to load demos"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const create = async () => {
    if (!id || !form.label.trim() || !form.target_url.startsWith("http")) return;
    try { await api.createDemoLink(id as string, form); setForm({ label: "", target_url: "", expires_in_hours: 48 }); setShowForm(false); await load(); }
    catch { setError("Failed to create demo link"); }
  };
  const revoke = async (did: string) => {
    try { await api.revokeDemoLink(did); await load(); } catch { setError("Failed to revoke"); }
  };

  if (error && !items.length)
    return (
      <PortalEmptyState
        icon={AlertTriangle}
        title="Could not load demos"
        description={error}
        action={
          <button onClick={load} className="portal-btn-x">
            Retry
          </button>
        }
      />
    );
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"><MonitorPlay className="w-5 h-5 text-signal" /> Embedded Demos</h2>
        <button onClick={() => setShowForm(!showForm)} className="portal-btn-x"><Plus className="w-4 h-4" /> New link</button>
      </div>
      <p className="text-sm text-white/40 mb-4">Signed, time-limited SSO links into preview environments. Share an access link; revoke any time.</p>

      {showForm && (
        <div className="portal-panel-x mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">New demo link</h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (e.g. Staging build)" className="portal-field-x" />
            <input value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="https://preview.env/..." className="portal-field-x" />
            <input type="number" value={form.expires_in_hours} onChange={(e) => setForm({ ...form, expires_in_hours: Number(e.target.value) })} placeholder="Expires in (hours)" className="portal-field-x" />
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={create} disabled={!form.label.trim() || !form.target_url.startsWith("http")} className="portal-btn-x disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((d) => (
          <div key={d.id} className={`portal-card-x flex items-center gap-4 p-4 ${d.is_revoked ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.label}</span>
                {d.is_revoked && <span className="text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400">Revoked</span>}
              </div>
              <p className="text-xs text-white/40 truncate">{d.target_url}</p>
              <p className="text-xs text-white/30 mt-0.5">{d.access_count} access{d.access_count === 1 ? "" : "es"}{d.expires_at ? ` · expires ${new Date(d.expires_at).toLocaleString()}` : ""}</p>
            </div>
            {!d.is_revoked && (
              <div className="flex items-center gap-2">
                <button onClick={() => navigator.clipboard?.writeText(d.access_url)} className="portal-btn-secondary-x text-xs" title="Copy access link"><Copy className="w-3.5 h-3.5" /> Copy</button>
                <a href={d.access_url} target="_blank" rel="noopener noreferrer" className="portal-btn-x text-xs"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
                <button onClick={() => revoke(d.id)} className="text-white/40 hover:text-red-400" title="Revoke"><Ban className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <PortalEmptyState
          compact
          icon={MonitorPlay}
          title="No demo links yet"
          description="Create a signed, time-limited SSO link to share a preview environment."
        />
      )}
    </div>
  );
}
