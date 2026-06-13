"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  Scale,
  AlertTriangle,
  Network,
  Activity,
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

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, locale } = useParams();
  const pathname = usePathname();
  const [engagement, setEngagement] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    api.getEngagement(id as string).then((d) => setEngagement(d));
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
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-signal">
            {engagement.Sector} · {engagement.ServiceLine}
          </p>
          <h1 className="text-2xl font-bold mt-1">{engagement.Title}</h1>
          <p className="text-white/50 text-sm mt-1">{engagement.ClientName}</p>
        </div>
      )}

      <div className="flex gap-1 border-b border-white/10 mb-8">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-signal text-signal"
                  : "border-transparent text-white/50 hover:text-white"
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
