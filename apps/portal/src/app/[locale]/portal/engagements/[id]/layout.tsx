"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  Scale,
  AlertTriangle,
  Network,
  Users,
  Ticket,
  Wallet,
  Receipt,
  Layers,
  MonitorPlay,
  BookOpen,
  FileBarChart,
  CheckSquare,
  Flag,
} from "lucide-react";

interface Engagement {
  Sector?: string;
  ServiceLine?: string;
  Title?: string;
  ClientName?: string;
}

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, locale } = useParams();
  const pathname = usePathname();
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getEngagement(id as string).then((d) => setEngagement(d as Engagement));
  }, [id]);

  const tabs = [
    { href: `/${locale}/portal/engagements/${id}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/milestones`, label: "Milestones", icon: <Flag className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/deliverables`, label: "Deliverables", icon: <FileText className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/decisions`, label: "Decisions", icon: <Scale className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/risks`, label: "Risks", icon: <AlertTriangle className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/stakeholders`, label: "Stakeholders", icon: <Network className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/team`, label: "Team", icon: <Users className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/tickets`, label: "Tickets", icon: <Ticket className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/budget`, label: "Budget", icon: <Wallet className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/invoices`, label: "Invoices", icon: <Receipt className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/capabilities`, label: "Capabilities", icon: <Layers className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/demos`, label: "Demos", icon: <MonitorPlay className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/documents`, label: "Documents", icon: <BookOpen className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/reports`, label: "Reports", icon: <FileBarChart className="w-4 h-4" /> },
    { href: `/${locale}/portal/engagements/${id}/approvals`, label: "Approvals", icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div>
      {engagement && (
        <div className="portal-panel-x mb-6 p-5 sm:p-6">
          <Link href={`/${locale}/portal/engagements`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" />
            Engagements
          </Link>
          <p className="portal-meta-x text-signal">
            {[engagement.Sector, engagement.ServiceLine].filter(Boolean).join(" · ") || "Engagement"}
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{engagement.Title}</h1>
          <p className="mt-2 text-sm text-white/50">{engagement.ClientName}</p>
        </div>
      )}

      <div className="portal-scrollbar-x mb-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "border-white/10 bg-white/[0.035] text-white/52 hover:border-white/20 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
