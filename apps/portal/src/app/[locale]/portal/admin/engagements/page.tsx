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
  discovery: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  scoping: "text-purple-300 bg-purple-400/10 border-purple-400/20",
  active: "text-green-300 bg-green-400/10 border-green-400/20",
  paused: "text-yellow-200 bg-yellow-400/10 border-yellow-400/20",
  completed: "text-signal bg-signal/10 border-signal/20",
  archived: "text-white/36 bg-white/5 border-white/10",
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
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="portal-skeleton-x h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Admin</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Engagements</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Create client workspaces, manage stage metadata, and prepare white-label portal configuration.
              </p>
            </div>
          </div>
          <button onClick={() => setCreating(!creating)} className="portal-btn-x">
            <Plus className="w-4 h-4" />
            New engagement
          </button>
        </div>
      </section>

      {creating && (
        <div className="portal-panel-x space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="portal-meta-x">New workspace</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Create engagement</h2>
            </div>
            <button onClick={() => setCreating(false)} className="portal-admin-action-x" aria-label="Close form">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-white/50 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="portal-field-x w-full"
                placeholder="client-project-2024"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Stage *</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="portal-field-x w-full"
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
                className="portal-field-x w-full"
                placeholder="Digital Transformation Programme"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Client Name *</label>
              <input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Ministry of Finance"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Sector *</label>
              <input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Government"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Service Line *</label>
              <input
                value={form.service_line}
                onChange={(e) => setForm({ ...form, service_line: e.target.value })}
                className="portal-field-x w-full"
                placeholder="National-Scale Platform"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Target End Date</label>
              <input
                type="date"
                value={form.target_end_date}
                onChange={(e) => setForm({ ...form, target_end_date: e.target.value })}
                className="portal-field-x w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Budget (USD)</label>
              <input
                type="number"
                value={form.budget_total_usd}
                onChange={(e) => setForm({ ...form, budget_total_usd: e.target.value })}
                className="portal-field-x w-full"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Currency</label>
              <select
                value={form.currency_preference}
                onChange={(e) => setForm({ ...form, currency_preference: e.target.value })}
                className="portal-field-x w-full"
              >
                <option value="USD">USD</option>
                <option value="GHS">GHS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="portal-field-x w-full h-20"
                placeholder="Brief description of the engagement scope..."
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className="portal-field-x flex-1"
                  placeholder="client.xcreativs.com"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="portal-btn-x disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="portal-btn-secondary-x"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {engagements.length === 0 ? (
        <div className="portal-panel-x p-8 text-center text-white/40">
          <Briefcase className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <h2 className="font-display text-xl font-semibold text-white/72">No engagements found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">Create the first engagement to unlock dashboards, milestones, deliverables, and client portal rooms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => (
            <div key={e.ID} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`portal-chip-x border capitalize ${stageColors[e.Stage] || "border-white/10 bg-white/5 text-white/50"}`}>
                      {e.Stage}
                    </span>
                    <span className="text-xs text-white/30 font-mono">/{e.Slug}</span>
                    {e.IsWhiteLabel && (
                      <span className="portal-chip-x">
                        <Globe className="w-3 h-3" />
                        {e.WhiteLabelDomain}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-xl font-semibold">{e.Title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/34">
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
