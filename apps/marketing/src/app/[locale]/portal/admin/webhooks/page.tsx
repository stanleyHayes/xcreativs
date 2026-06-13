"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WebhooksResponse, WebhookDeliveriesResponse } from "@/lib/types";
import { Webhook, Plus, Trash2, Loader2, Send, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

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
        ((await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/admin/webhooks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }).then((r) => r.json())) as WebhooksResponse);

      const dRes =
        (await api.listWebhookDeliveries?.()) ||
        ((await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/admin/webhooks/deliveries`, {
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/admin/webhooks`, {
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/admin/webhooks/${id}`, {
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
    return <div className="text-white/60">Loading webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Webhooks</h1>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1 bg-signal text-black px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Webhook
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-2 text-sm font-medium ${activeTab === "subscriptions" ? "text-signal border-b-2 border-signal" : "text-white/50 hover:text-white"}`}
        >
          Subscriptions ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab("deliveries")}
          className={`pb-2 text-sm font-medium ${activeTab === "deliveries" ? "text-signal border-b-2 border-signal" : "text-white/50 hover:text-white"}`}
        >
          Delivery Log ({deliveries.length})
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="border border-white/10 rounded-lg bg-foundation p-5 space-y-4">
          <h2 className="font-semibold">Create Webhook Subscription</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Zapier Integration"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">URL *</label>
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Events (comma-separated)</label>
              <input
                value={form.events}
                onChange={(e) => setForm({ ...form, events: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
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
              className="flex items-center gap-1 bg-signal text-black px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2 rounded text-sm text-white/70 hover:text-white border border-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeTab === "subscriptions" && (
        <>
          {webhooks.length === 0 ? (
            <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
              <Webhook className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No webhook subscriptions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="border border-white/10 rounded-lg bg-foundation p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${wh.is_active ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
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
                      className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-4"
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
            <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No deliveries yet. Events will appear here when triggered.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <div key={d.id} className="border border-white/10 rounded-lg bg-foundation p-5">
                  <div className="flex items-start justify-between">
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
                          <span className={`text-xs px-1.5 py-0.5 rounded ${d.response_status >= 200 && d.response_status < 300 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
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
