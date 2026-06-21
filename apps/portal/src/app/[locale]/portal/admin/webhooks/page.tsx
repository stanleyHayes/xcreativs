"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import type { WebhooksResponse, WebhookDeliveriesResponse } from "@xc/api/types";
import { Webhook, Plus, Trash2, Loader2, Send, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface WebhookSub {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  subscription_id: string;
  event: string;
  payload: Record<string, unknown>;
  response_status: number;
  response_body: string;
  error_message: string;
  created_at: string;
}

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "deliveries">("subscriptions");

  const [form, setForm] = useState({ name: "", url: "", events: "diagnostic_start,rfp_submit,booking_request" });

  const fetchData = useCallback(async () => {
    try {
      const whRes =
        (await api.listWebhooks?.()) ||
        ((await fetch(`/api/v1/admin/webhooks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }).then((r) => r.json())) as WebhooksResponse);

      const dRes =
        (await api.listWebhookDeliveries?.()) ||
        ((await fetch(`/api/v1/admin/webhooks/deliveries`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }).then((r) => r.json())) as WebhookDeliveriesResponse);

      await Promise.resolve().then(() => {
        setWebhooks((whRes?.webhooks as WebhookSub[] | undefined) || []);
        setDeliveries((dRes?.deliveries as WebhookDelivery[] | undefined) || []);
      });
    } catch {
      // ignore
    } finally {
      await Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/v1/admin/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          events: form.events.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      setCreating(false);
      setForm({ name: "", url: "", events: "diagnostic_start,rfp_submit,booking_request" });
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create webhook");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook subscription?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/v1/admin/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(null);
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
              <Webhook className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Integrations</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Webhooks</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Manage outbound webhook subscriptions and inspect delivery attempts for operational events.
              </p>
            </div>
          </div>
          <button onClick={() => setCreating(!creating)} className="portal-btn-x">
            <Plus className="w-4 h-4" />
            New webhook
          </button>
        </div>
      </section>

      <div className="portal-admin-tabs-x portal-scrollbar-x">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`portal-admin-tab-x ${activeTab === "subscriptions" ? "portal-admin-tab-x-active" : ""}`}
        >
          Subscriptions ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab("deliveries")}
          className={`portal-admin-tab-x ${activeTab === "deliveries" ? "portal-admin-tab-x-active" : ""}`}
        >
          Delivery Log ({deliveries.length})
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="portal-panel-x space-y-4 p-5">
          <div>
            <p className="portal-meta-x">New subscription</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">Create webhook subscription</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Zapier Integration"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">URL *</label>
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="portal-field-x w-full"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Events (comma-separated)</label>
              <input
                value={form.events}
                onChange={(e) => setForm({ ...form, events: e.target.value })}
                className="portal-field-x w-full"
                placeholder="diagnostic_start, rfp_submit, booking_request"
              />
              <p className="text-xs text-white/30 mt-1">
                Available: diagnostic_start, rfp_submit, booking_request. Use &quot;all&quot; for everything.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="portal-btn-x disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="portal-btn-secondary-x"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeTab === "subscriptions" && (
        <>
          {webhooks.length === 0 ? (
            <PortalEmptyState
              icon={Webhook}
              title="No webhooks yet"
              description="Create a subscription to notify external systems about portal events."
            />
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="portal-card-x p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`portal-chip-x ${wh.is_active ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                          {wh.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-white/30">{wh.events.join(", ")}</span>
                      </div>
                      <p className="font-medium">{wh.name}</p>
                      <p className="text-sm text-white/50 font-mono truncate">{wh.url}</p>
                      <p className="mt-1 text-xs text-white/30">
                        Created {new Date(wh.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      disabled={deleting === wh.id}
                      className="portal-admin-action-x portal-admin-action-danger-x shrink-0 disabled:opacity-50 lg:ml-4"
                    >
                      {deleting === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "deliveries" && (
        <>
          {deliveries.length === 0 ? (
            <PortalEmptyState
              icon={Clock}
              title="No webhook deliveries yet"
              description="Events will appear here after outbound webhook attempts are triggered."
            />
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div key={d.id} className="portal-card-x p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {d.response_status >= 200 && d.response_status < 300 ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : d.error_message ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-xs font-medium text-white/70">{d.event}</span>
                        {d.response_status > 0 && (
                          <span className={`portal-chip-x ${d.response_status >= 200 && d.response_status < 300 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                            {d.response_status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 font-mono truncate">
                        {JSON.stringify(d.payload).slice(0, 200)}
                        {JSON.stringify(d.payload).length > 200 && "..."}
                      </p>
                      {d.error_message && (
                        <p className="text-xs text-red-400 mt-1">{d.error_message}</p>
                      )}
                      <p className="mt-1 text-xs text-white/30">
                        {new Date(d.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
