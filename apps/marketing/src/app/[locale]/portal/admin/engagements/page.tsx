"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { Briefcase, Plus, Loader2, Save, X, Building2, Globe } from "lucide-react";

interface Engagement {
  ID: string;
  Slug: string;
  ClientName: string;
  Title: string;
  Description: string;
  Sector: string;
  ServiceLine: string;
  Stage: string;
  StartDate: string | null;
  TargetEndDate: string | null;
  BudgetTotalUSD: number | null;
  CurrencyPreference: string;
  IsWhiteLabel: boolean;
  WhiteLabelDomain: string;
  CreatedAt: string;
}

const stageColors: Record<string, string> = {
  discovery: "text-blue-400 bg-blue-400/10",
  scoping: "text-purple-400 bg-purple-400/10",
  active: "text-green-400 bg-green-400/10",
  paused: "text-yellow-400 bg-yellow-400/10",
  completed: "text-signal bg-signal/10",
  archived: "text-white/30 bg-white/5",
};

export default function AdminEngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    client_name: "",
    title: "",
    description: "",
    sector: "",
    service_line: "",
    stage: "discovery",
    start_date: "",
    target_end_date: "",
    budget_total_usd: "",
    currency_preference: "USD",
    is_white_label: false,
    white_label_domain: "",
  });

  const fetchEngagements = useCallback(async () => {
    try {
      const res = await api.listAllEngagements();
      setEngagements((res.engagements as unknown as Engagement[]) ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await api.listAllEngagements();
        if (!active) return;
        setEngagements((res.engagements as unknown as Engagement[]) ?? []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        budget_total_usd: form.budget_total_usd ? parseFloat(form.budget_total_usd) : null,
        start_date: form.start_date || null,
        target_end_date: form.target_end_date || null,
      };
      await api.createEngagement(payload);
      setCreating(false);
      setForm({
        slug: "", client_name: "", title: "", description: "", sector: "", service_line: "",
        stage: "discovery", start_date: "", target_end_date: "", budget_total_usd: "",
        currency_preference: "USD", is_white_label: false, white_label_domain: "",
      });
      await fetchEngagements();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create engagement";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-white/60">Loading engagements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Engagements</h1>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1 bg-signal text-black px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Engagement
        </button>
      </div>

      {creating && (
        <div className="border border-white/10 rounded-lg bg-foundation p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create Engagement</h2>
            <button onClick={() => setCreating(false)} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="client-project-2024"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Stage *</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                {["discovery", "scoping", "active", "paused", "completed", "archived"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Digital Transformation Programme"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Client Name *</label>
              <input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Ministry of Finance"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Sector *</label>
              <input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Government"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Service Line *</label>
              <input
                value={form.service_line}
                onChange={(e) => setForm({ ...form, service_line: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="National-Scale Platform"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Target End Date</label>
              <input
                type="date"
                value={form.target_end_date}
                onChange={(e) => setForm({ ...form, target_end_date: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Budget (USD)</label>
              <input
                type="number"
                value={form.budget_total_usd}
                onChange={(e) => setForm({ ...form, budget_total_usd: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Currency</label>
              <select
                value={form.currency_preference}
                onChange={(e) => setForm({ ...form, currency_preference: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                <option value="USD">USD</option>
                <option value="GHS">GHS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white h-20"
                placeholder="Brief description of the engagement scope..."
              />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.is_white_label}
                  onChange={(e) => setForm({ ...form, is_white_label: e.target.checked })}
                  className="rounded border-white/20"
                />
                White-label workspace
              </label>
              {form.is_white_label && (
                <input
                  value={form.white_label_domain}
                  onChange={(e) => setForm({ ...form, white_label_domain: e.target.value })}
                  className="flex-1 bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                  placeholder="client.xcreativs.com"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-signal text-black px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 rounded text-sm text-white/70 hover:text-white border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {engagements.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
          <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No engagements found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => (
            <div key={e.ID} className="border border-white/10 rounded-lg bg-foundation p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageColors[e.Stage] || ""}`}>
                      {e.Stage}
                    </span>
                    <span className="text-xs text-white/30 font-mono">/{e.Slug}</span>
                    {e.IsWhiteLabel && (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {e.WhiteLabelDomain}
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{e.Title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-sm text-white/50">{e.ClientName}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-sm text-white/50">{e.Sector}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-sm text-white/50">{e.ServiceLine}</span>
                  </div>
                  {e.Description && (
                    <p className="text-xs text-white/40 mt-2 line-clamp-2">{e.Description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-white/30">
                    {e.StartDate && <span>Started: {new Date(e.StartDate).toLocaleDateString()}</span>}
                    {e.TargetEndDate && <span>Target: {new Date(e.TargetEndDate).toLocaleDateString()}</span>}
                    {e.BudgetTotalUSD && <span>Budget: ${e.BudgetTotalUSD.toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
