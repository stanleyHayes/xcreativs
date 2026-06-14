import Link from "next/link";
import { getLocale } from "next-intl/server";
import {
  BarChart3,
  Users,
  CalendarDays,
  Briefcase,
  FileText,
  Handshake,
  ClipboardList,
  PenLine,
  Palette,
  ScrollText,
  Webhook,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Section = { slug: string; label: string; desc: string; icon: LucideIcon; shortLabel?: string };

const SECTIONS: Section[] = [
  { slug: "analytics", label: "Analytics", desc: "Traffic, conversions, and portal activity.", icon: BarChart3 },
  { slug: "audit-logs", label: "Audit Logs", desc: "Review authenticated reads, writes, IPs, and export trails.", icon: ScrollText },
  { slug: "engagements", label: "Engagements", desc: "Create and manage client engagements.", icon: Briefcase },
  { slug: "applications", label: "Applications", desc: "Career applications and ATS pipeline.", icon: Users },
  { slug: "career-opportunities", label: "Career Opportunities", shortLabel: "Roles", desc: "Create and publish open roles on the public careers site.", icon: Briefcase },
  { slug: "partner-applications", label: "Partner Applications", shortLabel: "Partners", desc: "Review and approve partner intake.", icon: Handshake },
  { slug: "rfps", label: "RFPs", desc: "Tender and RFP submissions.", icon: ClipboardList },
  { slug: "bookings", label: "Bookings", desc: "Consultation bookings.", icon: CalendarDays },
  { slug: "signatures", label: "Signatures", desc: "Document signature requests.", icon: PenLine },
  { slug: "pages", label: "Pages (CMS)", desc: "Edit public site content.", icon: FileText },
  { slug: "themes", label: "Client Themes", desc: "White-label theme configuration.", icon: Palette },
  { slug: "webhooks", label: "Webhooks", desc: "Outbound webhook subscriptions.", icon: Webhook },
];

export default async function AdminHome() {
  const locale = await getLocale();
  const prioritySections = SECTIONS.slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="portal-meta-x text-signal">Admin</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-none">Control room</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58">
              Manage content, engagements, intake, partner operations, signatures, client themes, analytics, and platform delivery hooks.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[30rem]">
            {prioritySections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.slug}
                  href={`/${locale}/portal/admin/${section.slug}`}
                  className="portal-card-x min-w-0 p-3 hover:border-signal/45"
                  title={section.label}
                  aria-label={section.label}
                >
                  <Icon className="h-4 w-4 text-signal" />
                  <p className="mt-3 truncate text-xs font-semibold text-white/68">{section.shortLabel || section.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              href={`/${locale}/portal/admin/${s.slug}`}
              className="portal-card-x group p-5 hover:border-signal/50"
            >
              <div className="flex items-start justify-between">
                <span className="portal-admin-icon-x">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/22 transition-colors group-hover:text-signal" />
              </div>
              <h2 className="mt-4 font-semibold">{s.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/48">{s.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
