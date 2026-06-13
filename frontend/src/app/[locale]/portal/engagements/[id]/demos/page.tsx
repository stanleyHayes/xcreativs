"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MonitorPlay, Plus, X, ExternalLink, Ban, Copy } from "lucide-react";

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

  if (error && !items.length) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><MonitorPlay className="w-5 h-5 text-signal" /> Embedded Demos</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 transition"><Plus className="w-4 h-4" /> New link</button>
      </div>
      <p className="text-sm text-white/40 mb-4">Signed, time-limited SSO links into preview environments. Share an access link; revoke any time.</p>

      {showForm && (
        <div className="border border-white/10 rounded-lg p-4 mb-6 bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">New demo link</h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (e.g. Staging build)" className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="https://preview.env/..." className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input type="number" value={form.expires_in_hours} onChange={(e) => setForm({ ...form, expires_in_hours: Number(e.target.value) })} placeholder="Expires in (hours)" className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={create} disabled={!form.label.trim() || !form.target_url.startsWith("http")} className="px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((d) => (
          <div key={d.id} className={`flex items-center gap-4 border border-white/10 rounded-lg p-4 ${d.is_revoked ? "opacity-50" : ""}`}>
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
                <button onClick={() => navigator.clipboard?.writeText(d.access_url)} className="text-xs flex items-center gap-1 border border-white/10 px-2.5 py-1.5 rounded hover:bg-white/5" title="Copy access link"><Copy className="w-3.5 h-3.5" /> Copy</button>
                <a href={d.access_url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 bg-signal text-black px-2.5 py-1.5 rounded font-medium hover:opacity-90"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
                <button onClick={() => revoke(d.id)} className="text-white/40 hover:text-red-400" title="Revoke"><Ban className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-center text-white/30 py-8 text-sm">No demo links yet.</p>}
    </div>
  );
}
