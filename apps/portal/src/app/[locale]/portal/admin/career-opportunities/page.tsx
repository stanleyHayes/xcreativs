"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { api } from "@xc/api";
import { ArrowUpRight, Briefcase, Check, ExternalLink, Globe2, Loader2, Pencil, Plus, Save, Search, X } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface CareerRole {
  id: string;
  slug: string;
  title: string;
  title_fr: string;
  department: string;
  location: string;
  is_remote_friendly: boolean;
  employment_type: string;
  summary: string;
  summary_fr: string;
  responsibilities: string[];
  requirements: string[];
  compensation_philosophy: string;
  growth_trajectory: string;
  project_examples: string[];
  team_description: string;
  application_process: string;
  expected_start_window: string;
  is_open: boolean;
  published_at: string;
}

interface RoleForm {
  slug: string;
  title: string;
  title_fr: string;
  department: string;
  location: string;
  is_remote_friendly: boolean;
  employment_type: string;
  summary: string;
  summary_fr: string;
  responsibilities: string;
  requirements: string;
  compensation_philosophy: string;
  growth_trajectory: string;
  project_examples: string;
  team_description: string;
  application_process: string;
  expected_start_window: string;
  is_open: boolean;
}

const emptyForm: RoleForm = {
  slug: "",
  title: "",
  title_fr: "",
  department: "",
  location: "Remote",
  is_remote_friendly: true,
  employment_type: "full_time",
  summary: "",
  summary_fr: "",
  responsibilities: "",
  requirements: "",
  compensation_philosophy: "",
  growth_trajectory: "",
  project_examples: "",
  team_description: "",
  application_process: "",
  expected_start_window: "",
  is_open: true,
};

const employmentTypes = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : String(item))).filter(Boolean);
}

function normalizeRole(raw: unknown): CareerRole | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = readString(item.id ?? item.ID);
  const slug = readString(item.slug ?? item.Slug);
  if (!id || !slug) return null;
  return {
    id,
    slug,
    title: readString(item.title ?? item.Title),
    title_fr: readString(item.title_fr ?? item.TitleFR),
    department: readString(item.department ?? item.Department),
    location: readString(item.location ?? item.Location),
    is_remote_friendly: readBool(item.is_remote_friendly ?? item.IsRemoteFriendly, true),
    employment_type: readString(item.employment_type ?? item.EmploymentType) || "full_time",
    summary: readString(item.summary ?? item.Summary),
    summary_fr: readString(item.summary_fr ?? item.SummaryFR),
    responsibilities: readList(item.responsibilities ?? item.Responsibilities),
    requirements: readList(item.requirements ?? item.Requirements),
    compensation_philosophy: readString(item.compensation_philosophy ?? item.CompensationPhilosophy),
    growth_trajectory: readString(item.growth_trajectory ?? item.GrowthTrajectory),
    project_examples: readList(item.project_examples ?? item.ProjectExamples),
    team_description: readString(item.team_description ?? item.TeamDescription),
    application_process: readString(item.application_process ?? item.ApplicationProcess),
    expected_start_window: readString(item.expected_start_window ?? item.ExpectedStartWindow),
    is_open: readBool(item.is_open ?? item.IsOpen, false),
    published_at: readString(item.published_at ?? item.PublishedAt),
  };
}

function listToText(values: string[]): string {
  return values.join("\n");
}

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function roleToForm(role: CareerRole): RoleForm {
  return {
    slug: role.slug,
    title: role.title,
    title_fr: role.title_fr,
    department: role.department,
    location: role.location || "Remote",
    is_remote_friendly: role.is_remote_friendly,
    employment_type: role.employment_type || "full_time",
    summary: role.summary,
    summary_fr: role.summary_fr,
    responsibilities: listToText(role.responsibilities),
    requirements: listToText(role.requirements),
    compensation_philosophy: role.compensation_philosophy,
    growth_trajectory: role.growth_trajectory,
    project_examples: listToText(role.project_examples),
    team_description: role.team_description,
    application_process: role.application_process,
    expected_start_window: role.expected_start_window,
    is_open: role.is_open,
  };
}

function labelEmploymentType(value: string): string {
  return employmentTypes.find((item) => item.value === value)?.label || value.replace(/_/g, " ");
}

function formatPublishedAt(value: string): string {
  if (!value) return "Draft";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Published";
  return date.toLocaleDateString();
}

function shouldOpenNewRoleForm(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("new") === "1";
}

export default function AdminCareerOpportunitiesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const marketingURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const careersHref = `${marketingURL}${locale === "fr" ? "/fr" : ""}/careers`;

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(shouldOpenNewRoleForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const loadRoles = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.listCareerRolesAdmin();
      setRoles((res.roles || []).map(normalizeRole).filter((role): role is CareerRole => Boolean(role)));
      setLoadError("");
    } catch (err) {
      setRoles([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load career opportunities");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await api.listCareerRolesAdmin();
        if (!active) return;
        setRoles((res.roles || []).map(normalizeRole).filter((role): role is CareerRole => Boolean(role)));
        setLoadError("");
      } catch (err) {
        if (!active) return;
        setRoles([]);
        setLoadError(err instanceof Error ? err.message : "Failed to load career opportunities");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredRoles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter((role) =>
      [role.title, role.department, role.location, role.slug, role.summary].some((value) => value.toLowerCase().includes(needle))
    );
  }, [query, roles]);

  const openRoles = roles.filter((role) => role.is_open).length;
  const departments = new Set(roles.map((role) => role.department).filter(Boolean)).size;
  const remoteRoles = roles.filter((role) => role.is_remote_friendly).length;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setNotice("");
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setNotice("");
  }

  function startEdit(role: CareerRole) {
    setForm(roleToForm(role));
    setEditingId(role.id);
    setShowForm(true);
    setNotice("");
  }

  function getPayload() {
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      title_fr: form.title_fr.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      is_remote_friendly: form.is_remote_friendly,
      employment_type: form.employment_type,
      summary: form.summary.trim(),
      summary_fr: form.summary_fr.trim(),
      responsibilities: textToList(form.responsibilities),
      requirements: textToList(form.requirements),
      compensation_philosophy: form.compensation_philosophy.trim(),
      growth_trajectory: form.growth_trajectory.trim(),
      project_examples: textToList(form.project_examples),
      team_description: form.team_description.trim(),
      application_process: form.application_process.trim(),
      expected_start_window: form.expected_start_window.trim(),
      is_open: form.is_open,
    };
  }

  async function saveRole() {
    if (!form.title.trim() || !form.department.trim() || !form.summary.trim()) {
      setNotice("Title, department, and summary are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = getPayload();
      if (editingId) {
        await api.updateCareerRoleAdmin(editingId, payload);
      } else {
        await api.createCareerRoleAdmin(payload);
      }
      setNotice(editingId ? "Role updated." : "Role created.");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadRoles();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save role.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="portal-skeleton-x h-28" />
          <div className="portal-skeleton-x h-28" />
          <div className="portal-skeleton-x h-28" />
        </div>
        <div className="portal-skeleton-x h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Talent operations</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Career roles</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Create roles, publish open positions, and keep the public careers page aligned with current hiring needs.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={careersHref} target="_blank" rel="noopener noreferrer" className="portal-btn-secondary-x">
              <Globe2 className="h-4 w-4" />
              Browse careers
            </a>
            <button type="button" onClick={startCreate} className="portal-btn-x">
              <Plus className="h-4 w-4" />
              New role
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="portal-card-x portal-stat-x p-5">
          <p className="portal-meta-x">Published</p>
          <p className="font-display text-3xl font-semibold">{openRoles}</p>
          <p className="text-sm text-white/45">{roles.length - openRoles} draft or closed</p>
        </div>
        <div className="portal-card-x portal-stat-x p-5">
          <p className="portal-meta-x">Departments</p>
          <p className="font-display text-3xl font-semibold">{departments}</p>
          <p className="text-sm text-white/45">Hiring lanes represented</p>
        </div>
        <div className="portal-card-x portal-stat-x p-5">
          <p className="portal-meta-x">Remote friendly</p>
          <p className="font-display text-3xl font-semibold">{remoteRoles}</p>
          <p className="text-sm text-white/45">Roles marked flexible</p>
        </div>
      </div>

      {(showForm || notice) && (
        <section className="portal-panel-x space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="portal-meta-x">{editingId ? "Edit role" : "New role"}</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">{editingId ? "Update role details" : "Create a public role"}</h2>
              {notice && <p className="mt-2 text-sm text-signal">{notice}</p>}
            </div>
            {showForm && (
              <button type="button" onClick={resetForm} className="portal-admin-action-x" aria-label="Close role form">
                <X className="h-4 w-4" />
                Close
              </button>
            )}
          </div>

          {showForm && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Role title *">
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="portal-field-x"
                    placeholder="Senior Systems Architect"
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="portal-field-x"
                    placeholder="senior-systems-architect"
                  />
                </Field>
                <Field label="Department *">
                  <input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="portal-field-x"
                    placeholder="Enterprise systems"
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="portal-field-x"
                    placeholder="Accra / Remote"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Field label="Summary *">
                  <textarea
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    className="portal-field-x min-h-32 resize-y"
                    placeholder="Describe the mission, scope, and type of work this person will own."
                  />
                </Field>
                <div className="space-y-4">
                  <Field label="Employment type">
                    <div className="flex flex-wrap gap-2">
                      {employmentTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setForm({ ...form, employment_type: type.value })}
                          className={`portal-chip-x transition-colors ${
                            form.employment_type === type.value ? "portal-chip-x-active" : "hover:border-signal/45 hover:text-white/86"
                          }`}
                        >
                          {form.employment_type === type.value && <Check className="h-3.5 w-3.5" />}
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Toggle
                      label="Publish publicly"
                      checked={form.is_open}
                      onChange={() => setForm({ ...form, is_open: !form.is_open })}
                    />
                    <Toggle
                      label="Remote friendly"
                      checked={form.is_remote_friendly}
                      onChange={() => setForm({ ...form, is_remote_friendly: !form.is_remote_friendly })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Responsibilities">
                  <textarea
                    value={form.responsibilities}
                    onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                    className="portal-field-x min-h-36 resize-y"
                    placeholder={"Lead architecture reviews\nShape delivery standards\nPartner with client leadership"}
                  />
                </Field>
                <Field label="Requirements">
                  <textarea
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    className="portal-field-x min-h-36 resize-y"
                    placeholder={"8+ years building production systems\nStrong stakeholder communication\nExperience in regulated environments"}
                  />
                </Field>
                <Field label="Growth trajectory">
                  <textarea
                    value={form.growth_trajectory}
                    onChange={(e) => setForm({ ...form, growth_trajectory: e.target.value })}
                    className="portal-field-x min-h-28 resize-y"
                    placeholder="How this role can grow over the next 12-24 months."
                  />
                </Field>
                <Field label="Project examples">
                  <textarea
                    value={form.project_examples}
                    onChange={(e) => setForm({ ...form, project_examples: e.target.value })}
                    className="portal-field-x min-h-28 resize-y"
                    placeholder={"Digital public infrastructure audit\nAI-enabled workflow automation\nSecure enterprise portal rollout"}
                  />
                </Field>
                <Field label="Compensation philosophy">
                  <textarea
                    value={form.compensation_philosophy}
                    onChange={(e) => setForm({ ...form, compensation_philosophy: e.target.value })}
                    className="portal-field-x min-h-24 resize-y"
                    placeholder="How compensation is approached for this role."
                  />
                </Field>
                <Field label="Application process">
                  <textarea
                    value={form.application_process}
                    onChange={(e) => setForm({ ...form, application_process: e.target.value })}
                    className="portal-field-x min-h-24 resize-y"
                    placeholder="Application review, interview stages, assessment, final conversation."
                  />
                </Field>
                <Field label="Team description">
                  <input
                    value={form.team_description}
                    onChange={(e) => setForm({ ...form, team_description: e.target.value })}
                    className="portal-field-x"
                    placeholder="Small senior delivery team with product, engineering, and advisory leads"
                  />
                </Field>
                <Field label="Expected start window">
                  <input
                    value={form.expected_start_window}
                    onChange={(e) => setForm({ ...form, expected_start_window: e.target.value })}
                    className="portal-field-x"
                    placeholder="Q3 2026"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={saveRole} disabled={saving} className="portal-btn-x disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Save role" : "Publish role"}
                </button>
                <button type="button" onClick={resetForm} className="portal-btn-secondary-x">
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="portal-card-x p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="portal-meta-x">Role inventory</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">Open and draft roles</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="portal-field-x portal-field-icon-x"
                placeholder="Search roles"
              />
            </div>
            <button type="button" onClick={startCreate} className="portal-btn-x">
              <Plus className="h-4 w-4" />
              New role
            </button>
            <button type="button" onClick={() => void loadRoles()} className="portal-btn-secondary-x" disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <PortalEmptyState
          icon={Briefcase}
          eyebrow="Could not load roles"
          title="Career roles are unavailable"
          description={loadError}
          compact
          action={
            <button type="button" onClick={() => void loadRoles()} className="portal-btn-secondary-x">
              Retry
            </button>
          }
        />
      )}

      {!loadError && filteredRoles.length === 0 && (
        <PortalEmptyState
          icon={Briefcase}
          eyebrow={roles.length === 0 ? "No roles yet" : "No matches"}
          title={roles.length === 0 ? "Add the first role" : "No roles match this search"}
          description={
            roles.length === 0
              ? "Create a role here and publish it when it is ready for candidates on the public careers page."
              : "Clear the search or add a new role for the next hiring lane."
          }
          action={
            <button type="button" onClick={startCreate} className="portal-btn-x">
              <Plus className="h-4 w-4" />
              New role
            </button>
          }
          secondaryAction={
            <a href={careersHref} target="_blank" rel="noopener noreferrer" className="portal-btn-secondary-x">
              Browse marketing careers
            </a>
          }
        />
      )}

      {!loadError && filteredRoles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredRoles.map((role) => {
            const roleHref = `${careersHref}/${role.slug}`;
            return (
              <article key={role.id} className="portal-card-x p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`portal-chip-x ${
                          role.is_open ? "border-green-400/25 bg-green-400/10 text-green-300" : "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
                        }`}
                      >
                        {role.is_open ? "Published" : "Draft"}
                      </span>
                      <span className="portal-chip-x">{labelEmploymentType(role.employment_type)}</span>
                      {role.is_remote_friendly && <span className="portal-chip-x">Remote friendly</span>}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold leading-tight">{role.title}</h3>
                    <p className="mt-1 text-sm text-white/50">
                      {role.department}
                      {role.location ? ` · ${role.location}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(role)} className="portal-admin-action-x">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <a href={roleHref} target="_blank" rel="noopener noreferrer" className="portal-admin-action-x">
                      <ExternalLink className="h-4 w-4" />
                      View
                    </a>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/56">{role.summary}</p>
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-3">
                  <RoleMeta label="Slug" value={role.slug} />
                  <RoleMeta label="Published" value={formatPublishedAt(role.published_at)} />
                  <RoleMeta label="Requirements" value={`${role.requirements.length} listed`} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition-colors ${
        checked ? "border-signal/55 bg-signal/10 text-white/86" : "border-white/10 bg-white/5 text-white/52 hover:border-white/20"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${checked ? "bg-signal" : "bg-white/15"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function RoleMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="portal-meta-x">{label}</p>
      <p className="mt-1 truncate text-white/68">{value}</p>
    </div>
  );
}
