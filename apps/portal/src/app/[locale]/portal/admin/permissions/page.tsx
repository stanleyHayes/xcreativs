"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "@xc/api";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import type { AdminPermission, AdminRole } from "@xc/api/types";

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback((signal?: { active: boolean }) => {
    Promise.all([api.listPermissionsAdmin(), api.listRolesAdmin()])
      .then(([p, r]) => {
        if (!signal || signal.active) {
          setPermissions(p.permissions ?? []);
          setRoles(r.roles ?? []);
        }
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

  const roleHas = (role: AdminRole, perm: AdminPermission) =>
    role.permissions.some((p) => p.resource === perm.resource && p.action === perm.action);

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Access management</p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Permission management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                The permission catalogue and the live role matrix governing portal access.
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
          <Loader2 className="h-5 w-5 animate-spin" /> Loading permissions…
        </div>
      ) : error ? (
        <PortalEmptyState
          icon={AlertTriangle}
          title="Failed to load permissions"
          description="We couldn't load the permission catalogue. Please try again."
          compact
          action={
            <button onClick={() => load()} className="text-signal underline">
              Retry
            </button>
          }
        />
      ) : (
        <section className="portal-panel-x portal-scrollbar-x overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/35">
              <tr>
                <th className="px-5 py-4 font-semibold">Permission</th>
                {roles.map((r) => (
                  <th key={r.role} className="px-5 py-4 font-semibold capitalize">
                    {r.role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">
                      {perm.resource}:{perm.action}
                    </p>
                    {perm.description && (
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-white/45">{perm.description}</p>
                    )}
                  </td>
                  {roles.map((r) => {
                    const enabled = roleHas(r, perm);
                    return (
                      <td key={r.role} className="px-5 py-4">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
                            enabled
                              ? "border-green-300/25 bg-green-300/10 text-green-300"
                              : "border-white/10 bg-white/5 text-white/25"
                          }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
