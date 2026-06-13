"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Mail, CheckCircle, Clock, Plus, X, Loader2, Trash2 } from "lucide-react";
import type { TeamMembersResponse } from "@xc/api/types";

interface TeamMember {
  ID: string;
  Name: string;
  Role: string;
  Email: string;
  AvailabilityStatus: string;
  IsXCreativs: boolean;
}

export default function TeamPage() {
  const { id } = useParams();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    availability_status: "available",
    is_xcreativs: false,
  });

  async function fetchMembers() {
    try {
      const res = (await api.listTeamMembers(id as string)) as TeamMembersResponse;
      setMembers((res.team_members as TeamMember[] | undefined) || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await fetchMembers();
    })();
  }, [id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createTeamMember(id as string, form);
      setShowForm(false);
      setForm({ name: "", role: "", email: "", availability_status: "available", is_xcreativs: false });
      await fetchMembers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add team member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(memberID: string) {
    if (!confirm("Remove this team member?")) return;
    setRemoving(memberID);
    try {
      await api.removeTeamMember(id as string, memberID);
      await fetchMembers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  const xcreativs = members.filter((m) => m.IsXCreativs);
  const client = members.filter((m) => !m.IsXCreativs);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Team Directory</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-signal text-black px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Member
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-white/10 rounded-lg bg-foundation p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Add Team Member</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Role *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="Product Lead"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Availability</label>
              <select
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
                className="w-full bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.is_xcreativs}
              onChange={(e) => setForm({ ...form, is_xcreativs: e.target.checked })}
              className="rounded border-white/20"
            />
            XCreativs team member
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 bg-signal text-black px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Member
          </button>
        </form>
      )}

      {xcreativs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-medium uppercase tracking-wider text-signal mb-3">XCreativs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {xcreativs.map((m) => (
              <MemberCard key={m.ID} member={m} onRemove={handleRemove} removing={removing === m.ID} />
            ))}
          </div>
        </div>
      )}

      {client.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {client.map((m) => (
              <MemberCard key={m.ID} member={m} onRemove={handleRemove} removing={removing === m.ID} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, onRemove, removing }: { member: TeamMember; onRemove: (id: string) => void; removing: boolean }) {
  const available = member.AvailabilityStatus === "available";
  return (
    <div className="flex items-start gap-3 border border-white/10 rounded-lg p-4 group">
      <div className="w-10 h-10 rounded-full bg-signal/20 flex items-center justify-center text-signal font-medium text-sm shrink-0">
        {member.Name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.Name}</p>
        <p className="text-sm text-white/50">{member.Role}</p>
        {member.Email && (
          <a href={`mailto:${member.Email}`} className="text-xs text-signal hover:underline flex items-center gap-1 mt-1">
            <Mail className="w-3 h-3" />
            {member.Email}
          </a>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onRemove(member.ID)}
          disabled={removing}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 transition-all disabled:opacity-50"
          title="Remove"
        >
          {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
        <div className={`flex items-center gap-1 text-xs ${available ? "text-green-400" : "text-white/30"}`}>
          {available ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          <span className="capitalize">{member.AvailabilityStatus}</span>
        </div>
      </div>
    </div>
  );
}
