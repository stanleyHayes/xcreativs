"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Bell, Save } from "lucide-react";
import type { NotificationPreferences } from "@xc/api/types";

const segmentOptions = ["client", "partner", "candidate", "prospect"];

function Row({
  prefKey,
  label,
  hint,
  active,
  onToggle,
}: {
  prefKey: string;
  label: string;
  hint?: string;
  active: boolean;
  onToggle: (k: string) => void;
}) {
  return (
    <label className="flex items-center justify-between py-3 border-b border-white/5 cursor-pointer">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-white/40">{hint}</p>}</div>
      <button type="button" onClick={() => onToggle(prefKey)} className={`relative w-10 h-6 rounded-full transition-colors ${active ? "bg-signal" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getNotificationPreferences()
      .then((d) => setPrefs({ segments: [], ...d }))
      .catch(() => setPrefs({ email_enabled: true, inapp_enabled: true, sms_enabled: false, whatsapp_enabled: false, digest_frequency: "instant", phone: "", segments: [] }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (k: string) => setPrefs((p) => (p ? { ...p, [k]: !p[k] } : p));
  const toggleSegment = (s: string) => setPrefs((p) => (p ? { ...p, segments: p.segments?.includes(s) ? p.segments.filter((x) => x !== s) : [...(p.segments || []), s] } : p));

  async function save() {
    if (!prefs) return;
    setSaving(true); setSaved(false);
    try { await api.updateNotificationPreferences(prefs); setSaved(true); }
    catch { alert("Failed to save preferences"); }
    finally { setSaving(false); }
  }

  if (loading || !prefs)
    return (
      <div className="portal-panel-x mx-auto flex max-w-2xl items-center justify-center gap-3 p-12 text-sm text-white/55">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-signal" aria-hidden />
        Loading preferences…
      </div>
    );

  return (
    <div className="portal-panel-x mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight"><Bell className="w-5 h-5 text-signal" /> Notification Preferences</h1>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-1">Channels</h2>
        <Row prefKey="inapp_enabled" label="In-app" hint="Notifications inside the portal" active={!!prefs.inapp_enabled} onToggle={toggle} />
        <Row prefKey="email_enabled" label="Email" active={!!prefs.email_enabled} onToggle={toggle} />
        <Row prefKey="sms_enabled" label="SMS" hint="Requires a phone number" active={!!prefs.sms_enabled} onToggle={toggle} />
        <Row prefKey="whatsapp_enabled" label="WhatsApp" hint="Requires a phone number" active={!!prefs.whatsapp_enabled} onToggle={toggle} />
      </section>

      {(prefs.sms_enabled || prefs.whatsapp_enabled) && (
        <section className="mb-8">
          <label className="text-xs uppercase tracking-wider text-white/40 mb-1 block">Phone (E.164, e.g. +233…)</label>
          <input value={prefs.phone || ""} onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })} placeholder="+233200000000" className="portal-field-x w-full" />
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-2">Email digest</h2>
        <div className="flex gap-2 flex-wrap">
          {["instant", "daily", "weekly", "off"].map((f) => (
            <button key={f} onClick={() => setPrefs({ ...prefs, digest_frequency: f })} className={`portal-chip-x capitalize ${prefs.digest_frequency === f ? "portal-chip-x-active" : "hover:border-signal hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-2">Segments</h2>
        <p className="text-xs text-white/40 mb-2">Which broadcast audiences you belong to.</p>
        <div className="flex gap-2 flex-wrap">
          {segmentOptions.map((s) => (
            <button key={s} onClick={() => toggleSegment(s)} className={`portal-chip-x capitalize ${prefs.segments?.includes(s) ? "portal-chip-x-active" : "hover:border-signal hover:text-white"}`}>{s}</button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="portal-btn-x disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span className="text-sm text-signal">Saved ✓</span>}
      </div>
    </div>
  );
}
