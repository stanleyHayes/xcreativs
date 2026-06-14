import { Activity, Mail, Plus, ShieldCheck, UserCircle, Users } from "lucide-react";

const users = [
  {
    name: "Stanley Hayford",
    email: "stanley@example.com",
    role: "Admin",
    status: "Active",
    lastSeen: "Today",
  },
  {
    name: "Client Executive",
    email: "executive@example.com",
    role: "Executive",
    status: "Invited",
    lastSeen: "Pending",
  },
  {
    name: "Project Lead",
    email: "project@example.com",
    role: "Project",
    status: "Active",
    lastSeen: "Yesterday",
  },
];

export default function AdminUsersPage() {
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
                Manage workspace members, invitations, activity, and access status from one admin surface.
              </p>
            </div>
          </div>
          <button type="button" className="portal-btn-x">
            <Plus className="h-4 w-4" />
            Invite user
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Total users", value: users.length, icon: Users },
          { label: "Active users", value: users.filter((user) => user.status === "Active").length, icon: Activity },
          { label: "Privileged roles", value: 1, icon: ShieldCheck },
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
          <p className="mt-1 text-sm text-white/45">Seeded access-management view ready for API-backed user administration.</p>
        </div>
        <div className="divide-y divide-white/10">
          {users.map((user) => (
            <article key={user.email} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-signal">
                  <UserCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{user.name}</h3>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/45">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-white/55 sm:grid-cols-3 sm:text-right">
                <span>{user.role}</span>
                <span>{user.status}</span>
                <span>{user.lastSeen}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
