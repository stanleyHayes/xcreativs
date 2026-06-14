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
import { useTheme } from "@xc/ui/ThemeProvider";
import { useCurrency, CurrencyCode } from "@xc/ui/CurrencyProvider";
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
  // Guard the parse: a corrupt "user" value must not crash the whole portal.
  // On failure we drop the bad key so the next render / api.me() can recover.
  const initialUser: AuthUser | null = (() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  })();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [authChecked, setAuthChecked] = useState(Boolean(initialUser));
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
      <div className="flex min-h-[70vh] items-center justify-center bg-gravity text-foundation">
        <div className="portal-card-x px-6 py-4 text-sm text-white/60">Loading portal...</div>
      </div>
    );
  }

  return (
      <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-gravity text-foundation lg:flex-row">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.035]" />
        <div aria-hidden className="pointer-events-none absolute -right-[18%] top-0 h-[42rem] w-[42rem] rounded-full bg-signal/15 blur-[140px]" />
        {/* Sidebar */}
        <aside className="relative z-20 flex w-full shrink-0 flex-col border-b border-white/10 bg-white/[0.035] backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 p-4 lg:block lg:p-6">
          {clientTheme?.logo_url ? (
            <Link href={`/${locale}/portal`} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clientTheme.logo_url} alt={clientTheme.client_name} className="h-8 w-auto" />
            </Link>
          ) : (
            <Link href={`/${locale}/portal`} className="font-display text-xl font-semibold lg:text-2xl" style={{ color: clientTheme?.primary_color || undefined }}>
              {clientTheme?.client_name || "XCreativs Portal"}
            </Link>
          )}
          <p className="hidden text-xs text-white/35 lg:mt-2 lg:block">Secure workspace</p>
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={toggleTheme} className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-signal" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationBell />
          </div>
        </div>

        <nav className="portal-scrollbar-x flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-y-auto lg:pb-0">
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
            <div className="flex shrink-0 gap-2 border-l border-white/10 pl-2 lg:mt-4 lg:block lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
              <p className="hidden px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 lg:mb-2 lg:block">Admin</p>
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

        <div className="hidden border-t border-white/10 p-4 lg:block">
          {user && (
            <div className="portal-card-x mb-4 p-4">
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
      <main className="relative z-10 min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:p-8">{children}</div>
      </main>
    </div>
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
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:gap-3 ${
        active
          ? "bg-signal/15 text-signal shadow-[inset_0_0_0_1px_rgba(91,147,255,0.22)]"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
