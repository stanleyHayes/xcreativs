import { CheckCircle2, Plus, Shield, UserCog } from "lucide-react";

const roles = [
  {
    name: "Admin",
    summary: "Full workspace administration and configuration.",
    users: 1,
    permissions: ["users:write", "engagements:write", "billing:write", "content:write"],
  },
  {
    name: "Executive",
    summary: "Read strategic engagement views, invoices, and reports.",
    users: 1,
    permissions: ["engagements:read", "reports:read", "billing:read"],
  },
  {
    name: "Project",
    summary: "Coordinate day-to-day delivery workflows and decisions.",
    users: 1,
    permissions: ["engagements:read", "milestones:write", "tickets:write"],
  },
  {
    name: "Viewer",
    summary: "Read-only access to approved workspace material.",
    users: 0,
    permissions: ["engagements:read", "documents:read"],
  },
];

export default function AdminRolesPage() {
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
                Review role definitions, assigned users, and permission bundles before they are attached to accounts.
              </p>
            </div>
          </div>
          <button type="button" className="portal-btn-x">
            <Plus className="h-4 w-4" />
            New role
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <article key={role.name} className="portal-card-x p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="portal-admin-icon-x">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">{role.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{role.summary}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/55">
                {role.users} users
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span key={permission} className="portal-chip-x">
                  <CheckCircle2 className="h-3.5 w-3.5 text-signal" />
                  {permission}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
