"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { Bell, Check, CheckCheck, Inbox, Loader2, MailOpen, Radio } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import type { NotificationItem } from "@xc/api/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.listNotifications(100);
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchNotifications();
    })();
  }, [fetchNotifications]);

  async function markRead(id: string) {
    setMarkingId(id);
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => api.markNotificationRead(n.id).catch(() => {})));
    await fetchNotifications();
    setMarkingAll(false);
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeColors: Record<string, string> = {
    diagnostic_start: "text-blue-400 bg-blue-400/10",
    rfp_submit: "text-green-400 bg-green-400/10",
    booking_request: "text-purple-400 bg-purple-400/10",
    default: "text-white/40 bg-white/5",
  };

  const readCount = notifications.length - unreadCount;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <Bell className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Notification centre</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Notifications
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/58 sm:text-base">
              Triage workspace events, system alerts, partner activity, and intake updates without losing the delivery thread.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="portal-btn-secondary-x shrink-0 disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark all read
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total", value: notifications.length, icon: Inbox },
            { label: "Unread", value: unreadCount, icon: Radio },
            { label: "Archived read", value: readCount, icon: MailOpen },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="portal-card-x p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="portal-meta-x">{metric.label}</p>
                  <Icon className="h-4 w-4 text-signal" />
                </div>
                <p className="font-display mt-3 text-3xl font-semibold">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="portal-panel-x p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="portal-meta-x">Inbox view</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">
              {filter === "unread" ? "Unread updates" : "All updates"}
            </h2>
          </div>
          <div className="portal-admin-tabs-x border-b-0 p-0">
            <button
              onClick={() => setFilter("all")}
              className={`portal-admin-tab-x ${filter === "all" ? "portal-admin-tab-x-active" : ""}`}
            >
              All
              <span className="text-white/40">{notifications.length}</span>
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`portal-admin-tab-x ${filter === "unread" ? "portal-admin-tab-x-active" : ""}`}
            >
              Unread
              <span className="text-white/40">{unreadCount}</span>
            </button>
          </div>
        </div>

        <div className="mt-5">
          {filtered.length === 0 ? (
            <PortalEmptyState
              icon={filter === "unread" ? MailOpen : Inbox}
              eyebrow="All clear"
              title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
              description={
                filter === "unread"
                  ? "Everything has been reviewed. Switch back to all updates when you want the full audit trail."
                  : "Workspace alerts, intake changes, and partner events will appear here as soon as they are emitted."
              }
              action={
                filter === "unread" ? (
                  <button onClick={() => setFilter("all")} className="portal-btn-secondary-x">
                    Show all updates
                  </button>
                ) : (
                  <button onClick={() => void fetchNotifications()} className="portal-btn-secondary-x">
                    Refresh inbox
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => {
                const type = n.notification_type || "default";
                return (
                  <div
                    key={n.id}
                    className={`portal-card-x flex items-start gap-4 p-4 transition-colors ${
                      n.is_read ? "opacity-75" : "border-signal/30"
                    }`}
                  >
                    <div className="mt-1">
                      {n.is_read ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-white/18" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_0_5px_rgba(91,147,255,0.12)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${typeColors[type] || typeColors.default}`}>
                          {type.replace(/_/g, " ")}
                        </span>
                        <span className="portal-chip-x text-[11px]">{n.channel}</span>
                      </div>
                      <p className={`text-sm ${n.is_read ? "text-white/58" : "font-semibold text-white"}`}>
                        {n.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-white/46">{n.body}</p>
                      <p className="mt-3 text-xs text-white/30">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        disabled={markingId === n.id}
                        className="portal-admin-action-x shrink-0 disabled:opacity-50"
                        title="Mark as read"
                      >
                        {markingId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
