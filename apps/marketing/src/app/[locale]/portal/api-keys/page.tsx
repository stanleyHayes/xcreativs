"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Key, Plus, X, Copy, Check, Trash2, Shield, Clock } from "lucide-react";

const scopeLabels: Record<string, string> = {
  engagement_read: "Read Engagements",
  engagement_write: "Write Engagements",
  portal_read: "Read Portal",
  portal_write: "Write Portal",
  partner_read: "Read Partner",
  admin: "Admin",
};

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes?: string[];
  is_active: boolean;
  created_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
}

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asOptionalString = (v: unknown): string | null =>
  typeof v === "string" ? v : null;

const toAPIKey = (entity: Record<string, unknown>): APIKey => ({
  id: asString(entity.id),
  name: asString(entity.name),
  prefix: asString(entity.prefix),
  scopes: Array.isArray(entity.scopes)
    ? entity.scopes.filter((s): s is string => typeof s === "string")
    : undefined,
  is_active: entity.is_active === true,
  created_at: asString(entity.created_at),
  last_used_at: asOptionalString(entity.last_used_at),
  expires_at: asOptionalString(entity.expires_at),
});

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", scopes: ["engagement_read"], expires: "never" });
  const [submitting, setSubmitting] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    api.listAPIKeys()
      .then((d) => { setKeys((d.keys || []).map(toAPIKey)); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createAPIKey({
        name: form.name,
        scopes: form.scopes,
        expires: form.expires === "never" ? "never" : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setNewKey(res.key);
      setShowForm(false);
      setForm({ name: "", scopes: ["engagement_read"], expires: "never" });
      load();
    } catch {
      alert("Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await api.revokeAPIKey(id);
      load();
    } catch {
      alert("Failed to revoke key");
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="text-white/60">Loading API keys...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-5 h-5 text-signal" /> API Keys</h1>
        <button onClick={() => { setShowForm(!showForm); setNewKey(null); }} className="flex items-center gap-1 text-sm bg-signal text-white px-3 py-1.5 rounded hover:bg-signal/90">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? "Cancel" : "New Key"}
        </button>
      </div>

      <p className="text-sm text-white/50 max-w-xl">
        Scoped API keys let you pull engagement data into your own systems. 
        Treat keys like passwords — they grant access to your workspace data.
      </p>

      {/* New key reveal */}
      {newKey && (
        <div className="border border-green-400/30 bg-green-400/5 rounded-lg p-4">
          <p className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1"><Shield className="w-4 h-4" /> Copy this key now — you won&apos;t see it again</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-black/30 rounded px-3 py-2 text-sm font-mono text-white/90 break-all">{newKey}</code>
            <button onClick={copyKey} className="px-3 py-2 bg-green-400/20 text-green-400 rounded hover:bg-green-400/30 transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-white/10 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold">Create New API Key</h3>
          <div>
            <label className="block text-sm text-white/60 mb-1">Key Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Production Integration" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Scopes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(scopeLabels).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded px-3 py-2 cursor-pointer hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(value)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, scopes: [...form.scopes, value] });
                      else setForm({ ...form, scopes: form.scopes.filter((s) => s !== value) });
                    }}
                    className="accent-signal"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Expiration</label>
            <select value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="never">Never</option>
              <option value="30d">30 days</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="bg-signal text-white text-sm px-4 py-2 rounded hover:bg-signal/90 disabled:opacity-50">{submitting ? "Creating..." : "Create Key"}</button>
        </form>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className={`border rounded-lg p-4 ${k.is_active ? "border-white/10" : "border-white/5 opacity-50"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded">
                  <Key className="w-4 h-4 text-signal" />
                </div>
                <div>
                  <p className="font-medium text-sm">{k.name}</p>
                  <p className="text-xs text-white/40 font-mono">{k.prefix}••••••••</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {k.scopes?.map((s: string) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 uppercase">{scopeLabels[s] || s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {k.is_active ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-400/10 text-green-400">Active</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40">Revoked</span>
                )}
                {k.is_active && (
                  <button onClick={() => handleRevoke(k.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors" title="Revoke">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created {new Date(k.created_at).toLocaleDateString()}</span>
              {k.last_used_at && <span className="flex items-center gap-1">Last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
              {k.expires_at && <span className="flex items-center gap-1 text-yellow-400">Expires {new Date(k.expires_at).toLocaleDateString()}</span>}
            </div>
          </div>
        ))}
        {keys.length === 0 && <p className="text-white/40">No API keys yet. Create your first key to access the API programmatically.</p>}
      </div>
    </div>
  );
}
