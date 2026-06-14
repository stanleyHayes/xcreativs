"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Shield, UserCog } from "lucide-react";
import { api } from "@xc/api";
import type { AdminRole } from "@xc/api/types";

const ROLE_SUMMARIES: Record<string, string> = {
  admin: "Full workspace administration and configuration.",
  executive: "Strategic engagement views, invoices, and reports.",
  project: "Coordinate day-to-day delivery workflows and decisions.",
  editor: "Create and update content and workspace records.",
  viewer: "Read-only access to approved workspace material.",
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback((signal?: { active: boolean }) => {
    api
      .listRolesAdmin()
      .then((d) => {
        if (!signal || signal.active) setRoles(d.roles ?? []);
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

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <UserCog className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Access management</p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Role management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                Roles and their permission bundles, with the number of members assigned to each.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => load()} className="portal-btn-x">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-white/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading roles…
        </div>
      ) : error ? (
        <div className="portal-card-x p-10 text-center text-white/60">
          Couldn&apos;t load roles.{" "}
          <button onClick={() => load()} className="text-signal underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <article key={role.role} className="portal-card-x p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="portal-admin-icon-x">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold capitalize text-white">{role.role}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">
                      {ROLE_SUMMARIES[role.role] ?? "Workspace role."}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/55">
                  {role.user_count} user{role.user_count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-white/35">No permissions assigned.</span>
                ) : (
                  role.permissions.map((p) => (
                    <span key={p.id} className="portal-chip-x">
                      <CheckCircle2 className="h-3.5 w-3.5 text-signal" />
                      {p.resource}:{p.action}
                    </span>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
