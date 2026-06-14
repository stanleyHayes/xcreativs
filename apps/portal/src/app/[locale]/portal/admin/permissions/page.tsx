import { LockKeyhole, ShieldCheck } from "lucide-react";

const permissionGroups = [
  {
    resource: "Users",
    description: "Invite, update, suspend, and review member access.",
    permissions: ["user:read", "user:write"],
  },
  {
    resource: "Engagements",
    description: "Control delivery workspace records, milestones, risks, tickets, and deliverables.",
    permissions: ["engagement:read", "engagement:write"],
  },
  {
    resource: "Content",
    description: "Manage public pages, reading-list content, webinars, media kit, and insight publishing.",
    permissions: ["content:read", "content:write"],
  },
  {
    resource: "Billing",
    description: "Access invoices, payment links, and budget visibility.",
    permissions: ["billing:read", "billing:write"],
  },
];

const roles = ["Admin", "Executive", "Project", "Viewer"];

export default function AdminPermissionsPage() {
  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex items-start gap-4">
          <span className="portal-admin-icon-x">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <p className="portal-meta-x text-signal">Access management</p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Permission management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
              See the permission catalogue and the role matrix that should govern portal access.
            </p>
          </div>
        </div>
      </section>

      <section className="portal-panel-x portal-scrollbar-x overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/35">
            <tr>
              <th className="px-5 py-4 font-semibold">Resource</th>
              {roles.map((role) => (
                <th key={role} className="px-5 py-4 font-semibold">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {permissionGroups.map((group, index) => (
              <tr key={group.resource}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{group.resource}</p>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-white/45">{group.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.permissions.map((permission) => (
                      <span key={permission} className="portal-chip-x">{permission}</span>
                    ))}
                  </div>
                </td>
                {roles.map((role, roleIndex) => {
                  const enabled = roleIndex === 0 || (role === "Executive" && index !== 2) || (role === "Project" && index === 1) || (role === "Viewer" && index === 1);
                  return (
                    <td key={role} className="px-5 py-4">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${enabled ? "border-green-300/25 bg-green-300/10 text-green-300" : "border-white/10 bg-white/5 text-white/25"}`}>
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
    </div>
  );
}
