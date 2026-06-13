"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, Save } from "lucide-react";

const segmentOptions = ["client", "partner", "candidate", "prospect"];

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getNotificationPreferences()
      .then((d) => setPrefs({ segments: [], ...d }))
      .catch(() => setPrefs({ email_enabled: true, inapp_enabled: true, sms_enabled: false, whatsapp_enabled: false, digest_frequency: "instant", phone: "", segments: [] }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (k: string) => setPrefs((p: any) => ({ ...p, [k]: !p[k] }));
  const toggleSegment = (s: string) => setPrefs((p: any) => ({ ...p, segments: p.segments?.includes(s) ? p.segments.filter((x: string) => x !== s) : [...(p.segments || []), s] }));

  async function save() {
    setSaving(true); setSaved(false);
    try { await api.updateNotificationPreferences(prefs); setSaved(true); }
    catch { alert("Failed to save preferences"); }
    finally { setSaving(false); }
  }

  if (loading || !prefs) return <div className="text-white/60 p-8">Loading…</div>;

  const Row = ({ k, label, hint }: { k: string; label: string; hint?: string }) => (
    <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-white/40">{hint}</p>}</div>
      <button type="button" onClick={() => toggle(k)} className={`relative w-10 h-6 rounded-full transition-colors ${prefs[k] ? "bg-signal" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${prefs[k] ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold flex items-center gap-2 mb-6"><Bell className="w-5 h-5 text-signal" /> Notification Preferences</h1>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-1">Channels</h2>
        <Row k="inapp_enabled" label="In-app" hint="Notifications inside the portal" />
        <Row k="email_enabled" label="Email" />
        <Row k="sms_enabled" label="SMS" hint="Requires a phone number" />
        <Row k="whatsapp_enabled" label="WhatsApp" hint="Requires a phone number" />
      </section>

      {(prefs.sms_enabled || prefs.whatsapp_enabled) && (
        <section className="mb-8">
          <label className="text-xs uppercase tracking-wider text-white/40 mb-1 block">Phone (E.164, e.g. +233…)</label>
          <input value={prefs.phone || ""} onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })} placeholder="+233200000000" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-2">Email digest</h2>
        <div className="flex gap-2 flex-wrap">
          {["instant", "daily", "weekly", "off"].map((f) => (
            <button key={f} onClick={() => setPrefs({ ...prefs, digest_frequency: f })} className={`px-3 py-1.5 rounded text-sm capitalize ${prefs.digest_frequency === f ? "bg-signal text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{f}</button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-2">Segments</h2>
        <p className="text-xs text-white/40 mb-2">Which broadcast audiences you belong to.</p>
        <div className="flex gap-2 flex-wrap">
          {segmentOptions.map((s) => (
            <button key={s} onClick={() => toggleSegment(s)} className={`px-3 py-1.5 rounded text-sm capitalize ${prefs.segments?.includes(s) ? "bg-signal text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{s}</button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-1 px-4 py-2 text-sm bg-signal text-black rounded-md hover:bg-signal/90 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span className="text-sm text-signal">Saved ✓</span>}
      </div>
    </div>
  );
}
