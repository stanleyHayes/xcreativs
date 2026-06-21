"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, Loader2, Mail, RefreshCw, ShieldCheck, UserCircle, Users } from "lucide-react";
import { api } from "@xc/api";
import type { AdminUser } from "@xc/api/types";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

const ROLES = ["admin", "executive", "project", "editor", "viewer"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback((signal?: { active: boolean }) => {
    api
      .listUsersAdmin()
      .then((d) => {
        if (!signal || signal.active) setUsers(d.users ?? []);
      })
      .catch(() => {
        if (!signal || signal.active) setError(true);
      })
      .finally(() => {
        if (!signal || signal.active) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const signal = { active: true };
    load(signal);
    return () => {
      signal.active = false;
    };
  }, [load]);

  const updateUser = async (id: string, data: { role?: string; is_active?: boolean }) => {
    setSavingId(id);
    try {
      await api.updateUserAdmin(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    } catch {
      load(); // resync on failure
    } finally {
      setSavingId(null);
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Access management</p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">User management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                Manage workspace members, roles, and access status. Changes apply immediately.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => load()} className="portal-btn-x">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Total users", value: users.length, icon: Users },
          { label: "Active users", value: activeCount, icon: Activity },
          { label: "Admins", value: adminCount, icon: ShieldCheck },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="portal-card-x portal-stat-x p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-white/55">
                <span>{stat.label}</span>
                <Icon className="h-4 w-4 text-signal" />
              </div>
              <p className="font-display text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <section className="portal-panel-x overflow-hidden">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-white">Workspace members</h2>
          <p className="mt-1 text-sm text-white/45">
            {users.length} member{users.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading members…
          </div>
        ) : error ? (
          <PortalEmptyState
            icon={AlertTriangle}
            title="Failed to load users"
            description="We couldn't load users right now. Please try again."
            action={
              <button onClick={() => load()} className="text-signal underline">
                Retry
              </button>
            }
          />
        ) : users.length === 0 ? (
          <PortalEmptyState
            icon={Users}
            title="No users yet"
            description="Workspace members will appear here once invited to collaborate."
          />
        ) : (
          <div className="divide-y divide-white/10">
            {users.map((user) => (
              <article key={user.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-signal">
                    <UserCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{user.name || user.email}</h3>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/45">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <select
                    value={user.role}
                    disabled={savingId === user.id}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    aria-label={`Role for ${user.email}`}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium capitalize text-white/80 focus:border-signal focus:outline-none disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-gravity">
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={savingId === user.id}
                    onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      user.is_active
                        ? "border border-green-300/25 bg-green-300/10 text-green-300"
                        : "border border-white/10 bg-white/5 text-white/45"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </button>
                  <span className="text-xs text-white/40">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
