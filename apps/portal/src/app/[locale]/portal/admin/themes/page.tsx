"use client";

import { useState } from "react";
import { api } from "@xc/api";
import { FileUpload } from "@xc/ui/FileUpload";
import { Palette, CheckCircle } from "lucide-react";

export default function AdminThemesPage() {
  const [engagementId, setEngagementId] = useState("");
  const [clientName, setClientName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0066CC");
  const [logoUrl, setLogoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.upsertClientTheme({
        engagement_id: engagementId,
        client_name: clientName,
        primary_color: primaryColor,
        logo_url: logoUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save theme");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-signal" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Client Theme Management</h1>
      </div>

      <form onSubmit={handleSave} className="portal-panel-x space-y-5 p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Engagement ID *</label>
          <input
            value={engagementId}
            onChange={(e) => setEngagementId(e.target.value)}
            placeholder="uuid"
            required
            className="portal-field-x w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Client Name *</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Organisation"
            required
            className="portal-field-x w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded border-none bg-transparent cursor-pointer"
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="portal-field-x flex-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <FileUpload
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
            folder="logos"
            accept="image/*"
            label="Upload logo (PNG / SVG)"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="portal-btn-x disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Theme"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>

      <div className="portal-panel-x p-6">
        <h2 className="font-semibold mb-3">Preview</h2>
        <div
          className="portal-card-x p-4"
          style={{ borderLeftWidth: "4px", borderLeftColor: primaryColor }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={clientName} className="h-8 w-auto mb-2" />
          ) : (
            <p className="font-bold" style={{ color: primaryColor }}>
              {clientName || "Client Portal"}
            </p>
          )}
          <p className="text-xs text-white/40 mt-1">Primary: {primaryColor}</p>
        </div>
      </div>
    </div>
  );
}
