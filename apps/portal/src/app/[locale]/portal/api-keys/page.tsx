"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@xc/api";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Fingerprint,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import CustomSelect from "@xc/ui/CustomSelect";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

const scopeLabels: Record<string, string> = {
  engagement_read: "Read engagements",
  engagement_write: "Write engagements",
  portal_read: "Read portal",
  portal_write: "Write portal",
  partner_read: "Read partner data",
  admin: "Admin access",
};

const scopeDescriptions: Record<string, string> = {
  engagement_read: "Pull engagement, milestone, and delivery records.",
  engagement_write: "Create or update engagement workflow data.",
  portal_read: "Read workspace profile and portal metadata.",
  portal_write: "Update portal-owned resources and preferences.",
  partner_read: "Read partner referrals, orders, and products.",
  admin: "Full administrative API access for trusted systems.",
};

const EXPIRATION_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const defaultForm = {
  name: "",
  scopes: ["engagement_read"],
  expires: "never",
};

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at?: string | null;
  expires_at?: string | null;
}

type APIKeyForm = typeof defaultForm;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asOptionalString = (v: unknown): string | null =>
  typeof v === "string" ? v : null;
const asBoolean = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

const getValue = (entity: Record<string, unknown>, keys: string[]): unknown =>
  keys.map((key) => entity[key]).find((value) => value !== undefined && value !== null);

const getTime = (value?: string | null): number => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value?: string | null): string => {
  const time = getTime(value);
  if (!time) return "Never";
  return new Date(time).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getExpirationValue = (value: string): string => {
  const days = value === "30d" ? 30 : value === "90d" ? 90 : 0;
  if (!days) return "never";
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
};

const toAPIKey = (entity: Record<string, unknown>): APIKey => {
  const rawScopes = getValue(entity, ["scopes", "Scopes"]);
  const scopes = Array.isArray(rawScopes)
    ? rawScopes.filter((scope): scope is string => typeof scope === "string")
    : [];

  return {
    id: asString(getValue(entity, ["id", "ID"])),
    name: asString(getValue(entity, ["name", "Name"])) || "Untitled key",
    prefix:
      asString(getValue(entity, ["prefix", "key_prefix", "KeyPrefix"])) ||
      "xc_unknown",
    scopes,
    is_active: asBoolean(getValue(entity, ["is_active", "IsActive"]), true),
    created_at: asString(getValue(entity, ["created_at", "CreatedAt"])),
    last_used_at: asOptionalString(getValue(entity, ["last_used_at", "LastUsedAt"])),
    expires_at: asOptionalString(getValue(entity, ["expires_at", "ExpiresAt"])),
  };
};

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<APIKeyForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await api.listAPIKeys();
        if (!active) return;
        setKeys((data.keys || []).map(toAPIKey));
        setLoadError(null);
      } catch {
        if (!active) return;
        setLoadError("API keys could not be loaded. Refresh the page or try again in a moment.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => getTime(b.created_at) - getTime(a.created_at)),
    [keys],
  );

  const activeKeys = useMemo(
    () => keys.filter((key) => key.is_active).length,
    [keys],
  );

  const uniqueScopeCount = useMemo(
    () => new Set(keys.flatMap((key) => key.scopes)).size,
    [keys],
  );

  const refreshKeys = async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      const data = await api.listAPIKeys();
      setKeys((data.keys || []).map(toAPIKey));
    } catch {
      setLoadError("API keys could not be refreshed. Try again in a moment.");
    } finally {
      setRefreshing(false);
    }
  };

  const updateScope = (scope: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      scopes: checked
        ? Array.from(new Set([...current.scopes, scope]))
        : current.scopes.filter((item) => item !== scope),
    }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setActionError(null);
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);

    if (!form.name.trim()) {
      setActionError("Give the key a name before creating it.");
      return;
    }

    if (form.scopes.length === 0) {
      setActionError("Select at least one scope for this key.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAPIKey({
        name: form.name.trim(),
        scopes: form.scopes,
        expires: getExpirationValue(form.expires),
      });

      setNewKey(res.key);
      setShowForm(false);
      resetForm();
      await refreshKeys();
    } catch {
      setActionError("Failed to create API key. Check your permissions and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!id) return;
    if (!confirm("Revoke this API key? This cannot be undone.")) return;

    setActionError(null);
    setRevokingId(id);
    try {
      await api.revokeAPIKey(id);
      setKeys((current) =>
        current.map((key) => (key.id === id ? { ...key, is_active: false } : key)),
      );
      await refreshKeys();
    } catch {
      setActionError("Failed to revoke API key. Refresh and try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;

    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Could not copy the key automatically. Select the key and copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-admin-header-x animate-pulse">
          <div className="h-5 w-24 rounded bg-white/10" />
          <div className="mt-4 h-9 w-64 max-w-full rounded bg-white/10" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-white/10" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="portal-card-x h-28 animate-pulse p-4">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="mt-8 h-8 w-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="portal-panel-x h-56 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
              <KeyRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="portal-meta-x text-signal">Developer access</p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                API keys
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                Create scoped keys for trusted integrations, reporting pipelines, and internal tools.
                Treat every key like a password because it can access workspace data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={refreshKeys} className="portal-btn-secondary-x" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setNewKey(null);
                setActionError(null);
              }}
              className={showForm ? "portal-btn-secondary-x" : "portal-btn-x"}
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancel" : "New key"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="portal-card-x portal-stat-x p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-white/55">
            <span>Total keys</span>
            <Fingerprint className="h-4 w-4 text-signal" />
          </div>
          <p className="font-display text-3xl font-semibold text-white">{keys.length}</p>
        </div>
        <div className="portal-card-x portal-stat-x p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-white/55">
            <span>Active keys</span>
            <ShieldCheck className="h-4 w-4 text-green-300" />
          </div>
          <p className="font-display text-3xl font-semibold text-white">{activeKeys}</p>
        </div>
        <div className="portal-card-x portal-stat-x p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-white/55">
            <span>Scopes in use</span>
            <Clock className="h-4 w-4 text-signal" />
          </div>
          <p className="font-display text-3xl font-semibold text-white">
            {uniqueScopeCount}
          </p>
        </div>
      </div>

      {(loadError || actionError) && (
        <div className="portal-panel-x flex flex-col gap-3 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <p>{actionError || loadError}</p>
          </div>
          {loadError && (
            <button type="button" onClick={refreshKeys} className="portal-btn-secondary-x text-xs" disabled={refreshing}>
              Try again
            </button>
          )}
        </div>
      )}

      {newKey && (
        <section className="portal-panel-x space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-green-300/25 bg-green-300/10 text-green-300">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Copy this key now</h2>
              <p className="mt-1 text-sm text-white/50">
                This is the only time the full secret will be shown. Store it in a secure vault.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white/85">
              {newKey}
            </code>
            <button type="button" onClick={copyKey} className="portal-btn-secondary-x sm:self-start">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="portal-panel-x space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="portal-meta-x text-signal">New credential</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Create API key</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Start narrow. Add only the scopes this integration needs.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/65">Key name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Production reporting pipeline"
                className="portal-field-x w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/65">Expiration</span>
              <CustomSelect
                value={form.expires}
                onChange={(value) => setForm((current) => ({ ...current, expires: value }))}
                options={EXPIRATION_OPTIONS}
                variant="portal"
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-white/65">Scopes</legend>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(scopeLabels).map(([value, label]) => {
                const checked = form.scopes.includes(value);
                return (
                  <label
                    key={value}
                    className={`flex min-h-[5.5rem] cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      checked
                        ? "border-signal/70 bg-signal/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-signal/45 hover:bg-white/[0.05] hover:text-white/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => updateScope(value, e.target.checked)}
                      className="mt-1 accent-signal"
                    />
                    <span>
                      <span className="block font-semibold">{label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-white/45">
                        {scopeDescriptions[value]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || form.scopes.length === 0}
              className="portal-btn-x disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Creating" : "Create key"}
            </button>
            <button type="button" onClick={resetForm} className="portal-btn-secondary-x">
              Reset
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="portal-meta-x text-white/35">Credential inventory</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Workspace keys</h2>
          </div>
          {keys.length > 0 && (
            <p className="text-sm text-white/45">
              {activeKeys} active of {keys.length}
            </p>
          )}
        </div>

        {sortedKeys.length === 0 ? (
          <PortalEmptyState
            icon={KeyRound}
            eyebrow="No credentials"
            title="No API keys yet"
            description="Create a scoped key when an integration needs programmatic access to this workspace."
            action={
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setNewKey(null);
                  setActionError(null);
                }}
                className="portal-btn-x"
              >
                <Plus className="h-4 w-4" />
                Create key
              </button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {sortedKeys.map((key) => (
              <article key={key.id || key.prefix} className={`portal-card-x p-4 sm:p-5 ${key.is_active ? "" : "opacity-60"}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-signal">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-full truncate text-sm font-semibold text-white">{key.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            key.is_active
                              ? "bg-green-300/10 text-green-300"
                              : "bg-white/5 text-white/40"
                          }`}
                        >
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-white/40">{key.prefix}************</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {key.scopes.length > 0 ? (
                          key.scopes.map((scope) => (
                            <span key={scope} className="portal-chip-x">
                              {scopeLabels[scope] || scope}
                            </span>
                          ))
                        ) : (
                          <span className="portal-chip-x">No scopes recorded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {key.is_active && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(key.id)}
                      disabled={!key.id || revokingId === key.id}
                      className="portal-admin-action-x self-start text-red-200 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                      title={key.id ? "Revoke key" : "Missing key identifier"}
                    >
                      {revokingId === key.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Revoke
                    </button>
                  )}
                </div>

                <dl className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs text-white/45 sm:grid-cols-3">
                  <div>
                    <dt className="text-white/30">Created</dt>
                    <dd className="mt-1 text-white/60">{formatDate(key.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/30">Last used</dt>
                    <dd className="mt-1 text-white/60">{formatDate(key.last_used_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/30">Expires</dt>
                    <dd className="mt-1 text-white/60">{formatDate(key.expires_at)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
