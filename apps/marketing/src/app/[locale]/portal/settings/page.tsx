"use client";

import { useState } from "react";
import { api } from "@xc/api";
import { Mail, Save, CheckCircle } from "lucide-react";
import type { AuthUser } from "@xc/api/types";

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  return JSON.parse(stored) as AuthUser;
}

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [firstName, setFirstName] = useState(() => getStoredUser()?.first_name || "");
  const [lastName, setLastName] = useState(() => getStoredUser()?.last_name || "");
  const [email, setEmail] = useState(() => getStoredUser()?.email || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const updated = (await api.updateProfile({ first_name: firstName, last_name: lastName, email })) as AuthUser;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-white/50 mb-8">Manage your profile and preferences.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-signal/20 flex items-center justify-center text-signal text-xl font-bold">
            {firstName[0]}{lastName[0]}
          </div>
          <div>
            <p className="font-medium">{firstName} {lastName}</p>
            <p className="text-sm text-white/50">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 pl-10 text-sm focus:outline-none focus:border-signal"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-signal text-sm">
            <CheckCircle className="w-4 h-4" />
            Profile updated successfully
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
