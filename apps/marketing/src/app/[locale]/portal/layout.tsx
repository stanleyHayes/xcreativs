"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { AuthUser } from "@xc/api/types";
import {
  LayoutDashboard,
  LogOut,
  Briefcase,
  Shield,
  Settings,
  FileText,
  Handshake,
  Key,
  ClipboardList,
  Sun,
  Moon,
  BarChart3,
  Mail,
  Palette,
  FileSignature,
  Calendar,
  LayoutTemplate,
  Webhook,
  Bell,
} from "lucide-react";
import ChatWidget from "@/components/concierge/ChatWidget";
import ThemeProvider from "@/components/ThemeProvider";
import { useTheme } from "@/components/ThemeProvider";
import CurrencyProvider from "@/components/CurrencyProvider";
import { useCurrency, CurrencyCode } from "@/components/CurrencyProvider";
import NotificationBell from "@/components/NotificationBell";
import ClientThemeProvider, { useClientTheme } from "@/components/ClientThemeProvider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientThemeProvider>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </ClientThemeProvider>
  );
}

function PortalLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const [user, setUser] = useState<AuthUser | null>(() =>
    storedUser ? (JSON.parse(storedUser) as AuthUser) : null
  );
  const [authChecked, setAuthChecked] = useState(() => Boolean(storedUser));
  const { theme: clientTheme, setEngagementId } = useClientTheme();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    if (!localStorage.getItem("user")) {
      api.me()
        .then((u) => {
          setUser(u as AuthUser);
          localStorage.setItem("user", JSON.stringify(u));
          setAuthChecked(true);
        })
        .catch(() => {
          router.push(`/${locale}/login`);
        });
    }
  }, [router, locale]);

  useEffect(() => {
    const match = pathname.match(/\/engagements\/([^\/]+)/);
    setEngagementId(match ? match[1] : null);
  }, [pathname, setEngagementId]);

  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    window.location.href = `/${locale}`;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gravity text-foundation flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <CurrencyProvider>
      <div className="min-h-screen bg-gravity text-foundation flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-6">
          {clientTheme?.logo_url ? (
            <Link href={`/${locale}/portal`} className="block">
              <img src={clientTheme.logo_url} alt={clientTheme.client_name} className="h-8 w-auto" />
            </Link>
          ) : (
            <Link href={`/${locale}/portal`} className="text-xl font-bold tracking-tight" style={{ color: clientTheme?.primary_color || undefined }}>
              {clientTheme?.client_name || "XCreativs Portal"}
            </Link>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink
            href={`/${locale}/portal`}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
            active={pathname === `/${locale}/portal`}
          />
          <SidebarLink
            href={`/${locale}/portal/engagements`}
            icon={<Briefcase className="w-4 h-4" />}
            label="Engagements"
            active={pathname.startsWith(`/${locale}/portal/engagements`)}
          />
          <SidebarLink
            href={`/${locale}/portal/notifications`}
            icon={<Bell className="w-4 h-4" />}
            label="Notifications"
            active={pathname === `/${locale}/portal/notifications`}
          />
          <SidebarLink
            href={`/${locale}/portal/partner`}
            icon={<Handshake className="w-4 h-4" />}
            label="Partner"
            active={pathname.startsWith(`/${locale}/portal/partner`)}
          />
          <SidebarLink
            href={`/${locale}/portal/mfa`}
            icon={<Shield className="w-4 h-4" />}
            label="Security"
            active={pathname === `/${locale}/portal/mfa`}
          />
          <SidebarLink
            href={`/${locale}/portal/settings`}
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
            active={pathname === `/${locale}/portal/settings`}
          />
          <SidebarLink
            href={`/${locale}/portal/api-keys`}
            icon={<Key className="w-4 h-4" />}
            label="API Keys"
            active={pathname === `/${locale}/portal/api-keys`}
          />
          <SidebarLink
            href={`/${locale}/portal/applications`}
            icon={<FileText className="w-4 h-4" />}
            label="My Applications"
            active={pathname === `/${locale}/portal/applications`}
          />
          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="px-3 text-[10px] uppercase tracking-wider text-white/30 mb-2">Admin</p>
              <SidebarLink
                href={`/${locale}/portal/admin/engagements`}
                icon={<Briefcase className="w-4 h-4" />}
                label="Engagements"
                active={pathname === `/${locale}/portal/admin/engagements`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/analytics`}
                icon={<BarChart3 className="w-4 h-4" />}
                label="Analytics"
                active={pathname === `/${locale}/portal/admin/analytics`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/partner-applications`}
                icon={<ClipboardList className="w-4 h-4" />}
                label="Partner Applications"
                active={pathname === `/${locale}/portal/admin/partner-applications`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/rfps`}
                icon={<Mail className="w-4 h-4" />}
                label="RFP Submissions"
                active={pathname === `/${locale}/portal/admin/rfps`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/themes`}
                icon={<Palette className="w-4 h-4" />}
                label="Client Themes"
                active={pathname === `/${locale}/portal/admin/themes`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/signatures`}
                icon={<FileSignature className="w-4 h-4" />}
                label="Signatures"
                active={pathname === `/${locale}/portal/admin/signatures`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/bookings`}
                icon={<Calendar className="w-4 h-4" />}
                label="Bookings"
                active={pathname === `/${locale}/portal/admin/bookings`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/pages`}
                icon={<LayoutTemplate className="w-4 h-4" />}
                label="Content Pages"
                active={pathname === `/${locale}/portal/admin/pages`}
              />
              <SidebarLink
                href={`/${locale}/portal/admin/webhooks`}
                icon={<Webhook className="w-4 h-4" />}
                label="Webhooks"
                active={pathname === `/${locale}/portal/admin/webhooks`}
              />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          {user && (
            <div className="mb-4">
              <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={toggleTheme} className="p-2 text-white/60 hover:text-signal transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer text-white/60 hover:text-signal transition-colors"
              aria-label="Currency"
            >
              <option value="USD" className="bg-gravity text-white">USD</option>
              <option value="GHS" className="bg-gravity text-white">GHS</option>
              <option value="EUR" className="bg-gravity text-white">EUR</option>
            </select>
            <NotificationBell />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-signal transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
      <ChatWidget />
    </div>
    </CurrencyProvider>
    </ThemeProvider>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-signal/10 text-signal"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
