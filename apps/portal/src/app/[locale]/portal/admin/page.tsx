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
  Webhook,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Section = { slug: string; label: string; desc: string; icon: LucideIcon };

const SECTIONS: Section[] = [
  { slug: "analytics", label: "Analytics", desc: "Traffic, conversions, and portal activity.", icon: BarChart3 },
  { slug: "engagements", label: "Engagements", desc: "Create and manage client engagements.", icon: Briefcase },
  { slug: "applications", label: "Applications", desc: "Career applications and ATS pipeline.", icon: Users },
  { slug: "partner-applications", label: "Partner Applications", desc: "Review and approve partner intake.", icon: Handshake },
  { slug: "rfps", label: "RFPs", desc: "Tender and RFP submissions.", icon: ClipboardList },
  { slug: "bookings", label: "Bookings", desc: "Consultation bookings.", icon: CalendarDays },
  { slug: "signatures", label: "Signatures", desc: "Document signature requests.", icon: PenLine },
  { slug: "pages", label: "Pages (CMS)", desc: "Edit public site content.", icon: FileText },
  { slug: "themes", label: "Client Themes", desc: "White-label theme configuration.", icon: Palette },
  { slug: "webhooks", label: "Webhooks", desc: "Outbound webhook subscriptions.", icon: Webhook },
];

export default async function AdminHome() {
  const locale = await getLocale();

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gravity/40">Admin</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">Control room</h1>
        <p className="mt-2 max-w-xl text-gravity/60">
          Manage content, engagements, intake, and platform configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              href={`/${locale}/portal/admin/${s.slug}`}
              className="group card-x p-5"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-foundation text-signal">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-gravity/30 transition-colors group-hover:text-signal" />
              </div>
              <h2 className="mt-4 font-semibold">{s.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-gravity/55">{s.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
