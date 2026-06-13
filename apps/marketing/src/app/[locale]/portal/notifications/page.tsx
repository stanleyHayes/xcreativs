"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, Check, CheckCheck, Loader2, Inbox } from "lucide-react";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  async function fetchNotifications() {
    try {
      const res = await api.listNotifications(100);
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await fetchNotifications();
    })();
  }, []);

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

  if (loading) {
    return <div className="text-white/60">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-signal text-black text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === "all" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === "unread" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1 bg-white/5 text-white/70 px-3 py-2 rounded text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-12 text-center text-white/40">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>{filter === "unread" ? "No unread notifications." : "No notifications yet."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                n.is_read
                  ? "border-white/5 bg-transparent"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="mt-0.5">
                {n.is_read ? (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-signal" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${typeColors[n.notification_type] || typeColors.default}`}>
                    {n.notification_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-white/30">{n.channel}</span>
                </div>
                <p className={`text-sm ${n.is_read ? "text-white/50" : "text-white font-medium"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-white/25 mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={markingId === n.id}
                  className="p-2 text-white/30 hover:text-signal transition-colors disabled:opacity-50 shrink-0"
                  title="Mark as read"
                >
                  {markingId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
