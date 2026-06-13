"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileText, Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react";

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

const statusColors: Record<string, string> = {
  published: "text-green-400 bg-green-400/10",
  draft: "text-yellow-400 bg-yellow-400/10",
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const emptyForm = {
    slug: "",
    title: "",
    title_fr: "",
    meta_description: "",
    meta_description_fr: "",
    data: {},
    status: "draft",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchPages = useCallback(async () => {
    try {
      const res = (await api.listPages(filter || undefined)) as unknown as PageItem[] | null;
      setPages(res || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = (await api.listPages(filter || undefined)) as unknown as PageItem[] | null;
        if (active) setPages(res || []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter]);

  function startEdit(page: PageItem) {
    setEditing(page);
    setForm({
      slug: page.slug,
      title: page.title,
      title_fr: page.title_fr,
      meta_description: page.meta_description,
      meta_description_fr: page.meta_description_fr,
      data: page.data || {},
      status: page.status,
    });
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyForm });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (creating) {
        await api.createPage(form);
      } else if (editing) {
        await api.updatePage(editing.id, form);
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
    return <div className="text-white/60">Loading pages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Content Pages</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={startCreate}
            className="flex items-center gap-1 bg-signal text-black px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <div className="border border-white/10 rounded-lg bg-foundation p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{creating ? "Create Page" : "Edit Page"}</h2>
            <button onClick={cancelEdit} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="about-us"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Title (EN) *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="About Us"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Title (FR)</label>
              <input
                value={form.title_fr}
                onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="À propos"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Meta Description (EN)</label>
              <input
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Brief description for SEO"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Meta Description (FR)</label>
              <input
                value={form.meta_description_fr}
                onChange={(e) => setForm({ ...form, meta_description_fr: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Brève description pour le SEO"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Page Data (JSON)</label>
              <textarea
                value={JSON.stringify(form.data, null, 2)}
                onChange={(e) => {
                  try {
                    setForm({ ...form, data: JSON.parse(e.target.value) });
                  } catch {
                    // allow invalid JSON while typing
                  }
                }}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white font-mono h-32"
                placeholder='{"hero": {"heading": "..."}}'
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-signal text-black px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded text-sm text-white/70 hover:text-white border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No pages found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div key={p.id} className="border border-white/10 rounded-lg bg-foundation p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || ""}`}>
                      {p.status}
                    </span>
                    <span className="text-xs text-white/30 font-mono">/{p.slug}</span>
                  </div>
                  <p className="font-medium truncate">{p.title}</p>
                  {p.title_fr && <p className="text-sm text-white/50 truncate">{p.title_fr}</p>}
                  {p.meta_description && (
                    <p className="text-xs text-white/40 mt-1 truncate">{p.meta_description}</p>
                  )}
                  <p className="mt-2 text-xs text-white/30">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                    {p.data && Object.keys(p.data).length > 0 && (
                      <span> · {Object.keys(p.data).length} data keys</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEdit(p)}
                    className="flex items-center gap-1 bg-white/5 text-white/70 px-3 py-1.5 rounded text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
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
