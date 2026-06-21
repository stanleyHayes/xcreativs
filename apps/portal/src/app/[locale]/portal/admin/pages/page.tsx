"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { AlertTriangle, FileText, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  title_fr: string;
  meta_description: string;
  meta_description_fr: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PageForm {
  slug: string;
  title: string;
  title_fr: string;
  meta_description: string;
  meta_description_fr: string;
  data: Record<string, unknown>;
  status: string;
}

const statusColors: Record<string, string> = {
  published: "text-green-300 bg-green-400/10 border-green-400/20",
  draft: "text-yellow-200 bg-yellow-400/10 border-yellow-400/20",
};

const PAGE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const PAGE_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  ...PAGE_STATUS_OPTIONS,
];

const emptyForm: PageForm = {
  slug: "",
  title: "",
  title_fr: "",
  meta_description: "",
  meta_description_fr: "",
  data: {},
  status: "draft",
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizePage(raw: unknown): PageItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = readString(item.id ?? item.ID);
  if (!id) return null;
  return {
    id,
    slug: readString(item.slug ?? item.Slug),
    title: readString(item.title ?? item.Title),
    title_fr: readString(item.title_fr ?? item.TitleFR),
    meta_description: readString(item.meta_description ?? item.MetaDescription),
    meta_description_fr: readString(item.meta_description_fr ?? item.MetaDescriptionFR),
    data: readRecord(item.data ?? item.Data),
    status: readString(item.status ?? item.Status) || "draft",
    created_at: readString(item.created_at ?? item.CreatedAt),
    updated_at: readString(item.updated_at ?? item.UpdatedAt),
  };
}

function normalizePagesResponse(response: unknown): PageItem[] {
  const maybePages = Array.isArray(response)
    ? response
    : typeof response === "object" && response !== null && Array.isArray((response as { pages?: unknown }).pages)
      ? (response as { pages: unknown[] }).pages
      : [];

  return maybePages
    .map(normalizePage)
    .filter((page): page is PageItem => Boolean(page));
}

function formatDate(value: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString();
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(emptyForm.data, null, 2));
  const [jsonError, setJsonError] = useState("");

  const fetchPages = useCallback(async () => {
    try {
      const res = await api.listPages(filter || undefined);
      setLoadError("");
      setPages(normalizePagesResponse(res));
    } catch (err) {
      setPages([]);
      setLoadError(getErrorMessage(err, "Failed to load pages"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await api.listPages(filter || undefined);
        if (!active) return;
        setLoadError("");
        setPages(normalizePagesResponse(res));
      } catch (err) {
        if (!active) return;
        setPages([]);
        setLoadError(getErrorMessage(err, "Failed to load pages"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter]);

  function setFormData(data: Record<string, unknown>) {
    setForm((current) => ({ ...current, data }));
    setJsonText(JSON.stringify(data, null, 2));
    setJsonError("");
  }

  function startEdit(page: PageItem) {
    setEditing(page);
    const nextForm = {
      slug: page.slug,
      title: page.title,
      title_fr: page.title_fr,
      meta_description: page.meta_description,
      meta_description_fr: page.meta_description_fr,
      data: page.data || {},
      status: page.status,
    };
    setForm(nextForm);
    setJsonText(JSON.stringify(nextForm.data, null, 2));
    setJsonError("");
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setFormData({});
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
    setJsonText(JSON.stringify(emptyForm.data, null, 2));
    setJsonError("");
  }

  function updateJson(nextValue: string) {
    setJsonText(nextValue);
    try {
      const parsed = JSON.parse(nextValue) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setJsonError("Page data must be a JSON object.");
        return;
      }
      setForm((current) => ({ ...current, data: parsed as Record<string, unknown> }));
      setJsonError("");
    } catch {
      setJsonError("Page data is not valid JSON yet.");
    }
  }

  function validateForm() {
    if (!form.slug.trim()) return "Slug is required.";
    if (!form.title.trim()) return "Title is required.";
    if (!["draft", "published"].includes(form.status)) return "Status must be draft or published.";
    if (jsonError) return jsonError;
    return "";
  }

  async function handleSave() {
    const validation = validateForm();
    if (validation) {
      alert(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug.trim(),
        title: form.title.trim(),
      };
      if (creating) {
        await api.createPage(payload);
      } else if (editing) {
        await api.updatePage(editing.id, payload);
      }
      cancelEdit();
      await fetchPages();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.deletePage(id);
      await fetchPages();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to delete"));
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

  const publishedCount = pages.filter((page) => page.status === "published").length;
  const draftCount = pages.filter((page) => page.status === "draft").length;
  const isEditing = creating || editing;

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">CMS</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Content pages</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Review public page records, localized titles, SEO copy, JSON page data, and publishing state.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CustomSelect value={filter} onChange={setFilter} options={PAGE_FILTER_OPTIONS} variant="portal" className="sm:w-44" />
            <button onClick={startCreate} className="portal-btn-x">
              <Plus className="w-4 h-4" />
              New page
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="portal-card-x p-4">
            <p className="portal-meta-x">Visible list</p>
            <p className="font-display mt-2 text-3xl font-semibold">{pages.length}</p>
          </div>
          <div className="portal-card-x p-4">
            <p className="portal-meta-x">Published</p>
            <p className="font-display mt-2 text-3xl font-semibold text-green-300">{publishedCount}</p>
          </div>
          <div className="portal-card-x p-4">
            <p className="portal-meta-x">Drafts</p>
            <p className="font-display mt-2 text-3xl font-semibold text-yellow-200">{draftCount}</p>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load CMS pages</p>
              <p className="mt-1 text-red-100/75">{loadError}</p>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="portal-panel-x space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="portal-meta-x">{creating ? "New content" : "Editing"}</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">{creating ? "Create page" : "Edit page"}</h2>
            </div>
            <button onClick={cancelEdit} className="portal-admin-action-x" aria-label="Close form">
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
                placeholder="about-us"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Status *</label>
              <CustomSelect
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={PAGE_STATUS_OPTIONS}
                variant="portal"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Title (EN) *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="portal-field-x w-full"
                placeholder="About Us"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Title (FR)</label>
              <input
                value={form.title_fr}
                onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                className="portal-field-x w-full"
                placeholder="À propos"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Meta Description (EN)</label>
              <input
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Brief description for SEO"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Meta Description (FR)</label>
              <input
                value={form.meta_description_fr}
                onChange={(e) => setForm({ ...form, meta_description_fr: e.target.value })}
                className="portal-field-x w-full"
                placeholder="Brève description pour le SEO"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Page Data (JSON)</label>
              <textarea
                value={jsonText}
                onChange={(e) => updateJson(e.target.value)}
                className={`portal-field-x h-40 w-full font-mono ${jsonError ? "border-red-400/50" : ""}`}
                placeholder='{"hero": {"heading": "..."}}'
              />
              {jsonError ? (
                <p className="mt-2 text-xs text-red-300">{jsonError}</p>
              ) : (
                <p className="mt-2 text-xs text-white/35">JSON must be an object. Changes are saved only when valid.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || Boolean(validateForm())}
              className="portal-btn-x disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="portal-btn-secondary-x"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <PortalEmptyState
          icon={FileText}
          eyebrow="CMS"
          title="No pages found"
          description={filter ? "Clear the status filter or create a new page record." : "Create the first CMS page record to manage public content from the portal."}
          action={
            filter ? (
              <button onClick={() => setFilter("")} className="portal-btn-secondary-x">
                Clear filter
              </button>
            ) : (
              <button onClick={startCreate} className="portal-btn-x">
                <Plus className="h-4 w-4" />
                New page
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div key={p.id} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`portal-chip-x border capitalize ${statusColors[p.status] || "border-white/10 bg-white/5 text-white/50"}`}>
                      {p.status}
                    </span>
                    <span className="text-xs text-white/30 font-mono">/{p.slug}</span>
                  </div>
                  <p className="font-display text-xl font-semibold truncate">{p.title}</p>
                  {p.title_fr && <p className="text-sm text-white/50 truncate">{p.title_fr}</p>}
                  {p.meta_description && (
                    <p className="text-xs text-white/40 mt-1 truncate">{p.meta_description}</p>
                  )}
                  <p className="mt-2 text-xs text-white/30">
                    Updated {formatDate(p.updated_at)}
                    {p.data && Object.keys(p.data).length > 0 && (
                      <span> · {Object.keys(p.data).length} data keys</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:ml-4">
                  <button
                    onClick={() => startEdit(p)}
                    className="portal-admin-action-x"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="portal-admin-action-x portal-admin-action-danger-x disabled:opacity-50"
                  >
                    {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
