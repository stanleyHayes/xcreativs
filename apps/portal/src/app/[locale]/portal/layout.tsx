"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@xc/api";
import type { AuthUser } from "@xc/api/types";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileSignature,
  FileText,
  Handshake,
  Key,
  LayoutDashboard,
  LayoutTemplate,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Sun,
  UserCircle,
  UserCog,
  Users,
  Webhook,
  X,
} from "lucide-react";
import { useTheme } from "@xc/ui/ThemeProvider";
import { useCurrency, CurrencyCode } from "@xc/ui/CurrencyProvider";
import CustomSelect from "@xc/ui/CustomSelect";
import NotificationBell from "@/components/NotificationBell";
import ClientThemeProvider, { useClientTheme } from "@/components/ClientThemeProvider";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface SidebarGroupConfig {
  id: string;
  label: string;
  items: SidebarItem[];
}

const defaultNavGroupOpen: Record<string, boolean> = {
  workspace: true,
  updates: true,
  account: true,
  adminCommand: true,
  peopleAccess: true,
  talentIntake: true,
  operations: true,
};

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>(defaultNavGroupOpen);
  const { theme: clientTheme, setEngagementId } = useClientTheme();

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setSidebarCollapsed(localStorage.getItem("xc-portal-sidebar") === "collapsed");
      const rawGroups = localStorage.getItem("xc-portal-sidebar-groups");
      if (rawGroups) {
        try {
          setOpenNavGroups({ ...defaultNavGroupOpen, ...(JSON.parse(rawGroups) as Record<string, boolean>) });
        } catch {
          localStorage.removeItem("xc-portal-sidebar-groups");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();

      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(locale === "en" ? "/login" : `/${locale}/login`);
        return;
      }

      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser) as AuthUser;
          if (!active) return;
          setUser(parsed);
          setAuthChecked(true);
          return;
        } catch {
          localStorage.removeItem("user");
        }
      }

      try {
        const u = await api.me();
        if (!active) return;
        setUser(u as AuthUser);
        localStorage.setItem("user", JSON.stringify(u));
        setAuthChecked(true);
      } catch {
        if (active) router.push(locale === "en" ? "/login" : `/${locale}/login`);
      }
    })();

    return () => {
      active = false;
    };
  }, [router, locale]);

  useEffect(() => {
    const match = pathname.match(/\/engagements\/([^\/]+)/);
    setEngagementId(match ? match[1] : null);
  }, [pathname, setEngagementId]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "GHS", label: "GHS" },
    { value: "EUR", label: "EUR" },
  ];

  const currentPath = pathname.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";
  const hrefFor = (path: string) => (locale === "en" ? path : `/${locale}${path}`);
  const isActive = (path: string, exact = false) =>
    exact ? currentPath === path : currentPath === path || currentPath.startsWith(`${path}/`);

  const workspaceGroups = useMemo<SidebarGroupConfig[]>(
    () => [
      {
        id: "workspace",
        label: "Workspace",
        items: [
          { path: "/portal", icon: <LayoutDashboard className="h-4 w-4" />, label: "Overview", exact: true },
          { path: "/portal/engagements", icon: <Briefcase className="h-4 w-4" />, label: "Engagements" },
        ],
      },
      {
        id: "updates",
        label: "Updates",
        items: [
          { path: "/portal/notifications", icon: <Bell className="h-4 w-4" />, label: "Notifications", exact: true },
          { path: "/portal/applications", icon: <FileText className="h-4 w-4" />, label: "My Applications", exact: true },
        ],
      },
      {
        id: "account",
        label: "Account",
        items: [
          { path: "/portal/partner", icon: <Handshake className="h-4 w-4" />, label: "Partner" },
          { path: "/portal/mfa", icon: <Shield className="h-4 w-4" />, label: "Security", exact: true },
          { path: "/portal/settings", icon: <Settings className="h-4 w-4" />, label: "Settings", exact: true },
          { path: "/portal/api-keys", icon: <Key className="h-4 w-4" />, label: "API Keys", exact: true },
        ],
      },
    ],
    []
  );

  const adminGroups = useMemo<SidebarGroupConfig[]>(
    () => [
	      {
	        id: "adminCommand",
	        label: "Command",
	        items: [
	          { path: "/portal/admin", icon: <LayoutDashboard className="h-4 w-4" />, label: "Admin Home", exact: true },
	          { path: "/portal/admin/analytics", icon: <BarChart3 className="h-4 w-4" />, label: "Analytics", exact: true },
	          { path: "/portal/admin/audit-logs", icon: <FileText className="h-4 w-4" />, label: "Audit Logs", exact: true },
	        ],
	      },
      {
        id: "peopleAccess",
        label: "People & access",
        items: [
          { path: "/portal/admin/users", icon: <Users className="h-4 w-4" />, label: "User Management" },
          { path: "/portal/admin/roles", icon: <UserCog className="h-4 w-4" />, label: "Role Management" },
          { path: "/portal/admin/permissions", icon: <LockKeyhole className="h-4 w-4" />, label: "Permissions" },
        ],
      },
      {
        id: "talentIntake",
        label: "Talent & intake",
        items: [
          { path: "/portal/admin/applications", icon: <Users className="h-4 w-4" />, label: "Applications", exact: true },
          { path: "/portal/admin/career-opportunities", icon: <Briefcase className="h-4 w-4" />, label: "Career Opportunities", exact: true },
          { path: "/portal/admin/partner-applications", icon: <ClipboardList className="h-4 w-4" />, label: "Partner Applications", exact: true },
          { path: "/portal/admin/rfps", icon: <Mail className="h-4 w-4" />, label: "RFP Submissions", exact: true },
        ],
      },
      {
        id: "operations",
        label: "Operations",
        items: [
          { path: "/portal/admin/engagements", icon: <Briefcase className="h-4 w-4" />, label: "Engagements", exact: true },
          { path: "/portal/admin/bookings", icon: <Calendar className="h-4 w-4" />, label: "Bookings", exact: true },
          { path: "/portal/admin/signatures", icon: <FileSignature className="h-4 w-4" />, label: "Signatures", exact: true },
          { path: "/portal/admin/pages", icon: <LayoutTemplate className="h-4 w-4" />, label: "Content Pages", exact: true },
          { path: "/portal/admin/themes", icon: <Palette className="h-4 w-4" />, label: "Client Themes", exact: true },
          { path: "/portal/admin/webhooks", icon: <Webhook className="h-4 w-4" />, label: "Webhooks", exact: true },
        ],
      },
    ],
    []
  );

  const activeItem = [...workspaceGroups, ...adminGroups]
    .flatMap((group) => group.items)
    .find((item) => isActive(item.path, item.exact));

  const isGroupOpen = (id: string) => openNavGroups[id] ?? true;

  const toggleNavGroup = (id: string) => {
    setOpenNavGroups((current) => {
      const next = { ...defaultNavGroupOpen, ...current, [id]: !(current[id] ?? true) };
      localStorage.setItem("xc-portal-sidebar-groups", JSON.stringify(next));
      return next;
    });
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("xc-portal-sidebar", next ? "collapsed" : "expanded");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    window.location.href = locale === "en" ? "/" : `/${locale}`;
  };

  if (!authChecked) {
    return (
      <div className="portal-shell-x flex min-h-[70vh] items-center justify-center bg-gravity text-foundation">
        <div className="portal-card-x px-6 py-4 text-sm text-white/60">Loading portal...</div>
      </div>
    );
  }

  return (
    <div className="portal-shell-x relative isolate flex min-h-screen flex-col overflow-x-hidden bg-gravity text-foundation lg:flex-row">
      <aside
        className={`relative z-20 hidden shrink-0 flex-col border-white/10 bg-white/[0.035] transition-[width] duration-200 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:border-r ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        <div className={`flex items-center justify-between gap-4 p-4 ${sidebarCollapsed ? "lg:px-3 lg:py-5" : "lg:block lg:p-6"}`}>
          {clientTheme?.logo_url ? (
            <Link href={hrefFor("/portal")} className="block min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clientTheme.logo_url} alt={clientTheme.client_name} className="h-8 w-auto" />
            </Link>
          ) : (
            <Link
              href={hrefFor("/portal")}
              className={`font-display min-w-0 font-semibold leading-none ${sidebarCollapsed ? "lg:flex lg:h-11 lg:w-11 lg:items-center lg:justify-center lg:rounded-lg lg:border lg:border-white/10 lg:bg-white/5 lg:text-lg" : "text-xl lg:text-2xl"}`}
              style={{ color: clientTheme?.primary_color || undefined }}
              title={clientTheme?.client_name || "XCreativs Portal"}
            >
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>{clientTheme?.client_name || "XCreativs Portal"}</span>
              <span className={sidebarCollapsed ? "hidden lg:inline" : "hidden"}>XC</span>
            </Link>
          )}
          <p className={`hidden text-xs text-white/35 lg:mt-2 ${sidebarCollapsed ? "lg:sr-only" : "lg:block"}`}>Secure workspace</p>
        </div>

        <nav className={`portal-scrollbar-x flex-1 space-y-3 overflow-y-auto px-4 pb-4 ${sidebarCollapsed ? "lg:px-3 lg:space-y-4" : ""}`}>
          {workspaceGroups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              idPrefix="desktop"
              collapsed={sidebarCollapsed}
              open={isGroupOpen(group.id)}
              active={group.items.some((item) => isActive(item.path, item.exact))}
              onToggle={() => toggleNavGroup(group.id)}
              hrefFor={hrefFor}
              isActive={isActive}
            />
          ))}

          {user?.role === "admin" && (
            <div className={`mt-4 space-y-3 border-t border-white/10 pt-4 ${sidebarCollapsed ? "lg:space-y-4" : ""}`}>
              <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 ${sidebarCollapsed ? "lg:sr-only" : ""}`}>Admin</p>
              {adminGroups.map((group) => (
                <SidebarGroup
                  key={group.id}
                  group={group}
                  idPrefix="desktop"
                  collapsed={sidebarCollapsed}
                  open={isGroupOpen(group.id)}
                  active={group.items.some((item) => isActive(item.path, item.exact))}
                  onToggle={() => toggleNavGroup(group.id)}
                  hrefFor={hrefFor}
                  isActive={isActive}
                />
              ))}
            </div>
          )}
        </nav>

        <div className={`hidden border-t border-white/10 p-4 lg:block lg:pb-12 ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          {user && (
            <Link
              href={hrefFor("/portal/settings")}
              className={`portal-card-x mb-4 block p-4 transition-colors hover:border-signal/45 ${sidebarCollapsed ? "lg:flex lg:h-11 lg:items-center lg:justify-center lg:p-0" : ""}`}
              title={`${user.first_name} ${user.last_name}`}
            >
              <UserCircle className={sidebarCollapsed ? "hidden h-5 w-5 text-signal lg:block" : "hidden"} />
              <span className={sidebarCollapsed ? "lg:sr-only" : ""}>
                <span className="block text-sm font-medium">{user.first_name} {user.last_name}</span>
                <span className="block truncate text-xs text-white/50">{user.email}</span>
              </span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-signal ${sidebarCollapsed ? "lg:w-full lg:justify-center" : ""}`}
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className={sidebarCollapsed ? "lg:sr-only" : ""}>Log out</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Portal navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="portal-shell-x relative flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-white/10 bg-gravity text-foundation shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="min-w-0">
                <Link
                  href={hrefFor("/portal")}
                  onClick={() => setMobileNavOpen(false)}
                  className="font-display block truncate text-2xl font-semibold"
                  style={{ color: clientTheme?.primary_color || undefined }}
                >
                  {clientTheme?.client_name || "XCreativs Portal"}
                </Link>
                <p className="mt-1 text-xs text-white/38">Secure workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/62 transition-colors hover:border-signal/45 hover:text-signal"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="portal-scrollbar-x flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-3">
                {workspaceGroups.map((group) => (
                  <SidebarGroup
                    key={group.id}
                    group={group}
                    idPrefix="mobile"
                    collapsed={false}
                    open={isGroupOpen(group.id)}
                    active={group.items.some((item) => isActive(item.path, item.exact))}
                    onToggle={() => toggleNavGroup(group.id)}
                    hrefFor={hrefFor}
                    isActive={isActive}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                ))}
              </div>

              {user?.role === "admin" && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Admin</p>
                  <div className="space-y-3">
                    {adminGroups.map((group) => (
                      <SidebarGroup
                        key={group.id}
                        group={group}
                        idPrefix="mobile"
                        collapsed={false}
                        open={isGroupOpen(group.id)}
                        active={group.items.some((item) => isActive(item.path, item.exact))}
                        onToggle={() => toggleNavGroup(group.id)}
                        hrefFor={hrefFor}
                        isActive={isActive}
                        onNavigate={() => setMobileNavOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </nav>

            <div className="border-t border-white/10 p-4">
              {user && (
                <Link
                  href={hrefFor("/portal/settings")}
                  onClick={() => setMobileNavOpen(false)}
                  className="portal-card-x mb-3 flex items-center gap-3 p-3 transition-colors hover:border-signal/45"
                >
                  <UserCircle className="h-5 w-5 text-signal" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{user.first_name} {user.last_name}</span>
                    <span className="block truncate text-xs text-white/50">{user.email}</span>
                  </span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white/62 transition-colors hover:border-signal/45 hover:text-signal"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className={`relative z-10 min-w-0 flex-1 overflow-auto transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-gravity/78 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/62 transition-colors hover:border-signal/45 hover:text-signal lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/62 transition-colors hover:border-signal/45 hover:text-signal lg:inline-flex"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <div className="min-w-0">
                <p className="portal-meta-x text-white/35">Workspace</p>
                <p className="truncate text-sm font-semibold text-white">{activeItem?.label || "Portal"}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={hrefFor("/portal")}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/5 hover:text-signal sm:inline-flex"
                aria-label="Search portal"
                title="Search portal"
              >
                <Search className="h-4 w-4" />
              </Link>
              <button
                onClick={toggleTheme}
                className="h-9 w-9 rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-signal"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="mx-auto h-4 w-4" /> : <Moon className="mx-auto h-4 w-4" />}
              </button>
              <CustomSelect
                value={currency}
                onChange={(value) => setCurrency(value as CurrencyCode)}
                options={currencyOptions}
                aria-label="Currency"
                variant="currency"
                className="custom-select-inline-x hidden sm:inline-block"
                triggerClassName="portal-currency-trigger-x"
              />
              <NotificationBell />
              <Link
                href={hrefFor("/portal/settings")}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-sm text-white/72 transition-colors hover:border-signal/45 hover:text-white"
                title="Profile and settings"
              >
                <UserCircle className="h-4 w-4 text-signal" />
                <span className="hidden max-w-[9rem] truncate lg:inline">{user?.first_name || "Profile"}</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarGroup({
  group,
  idPrefix,
  collapsed,
  open,
  active,
  onToggle,
  hrefFor,
  isActive,
  onNavigate,
}: {
  group: SidebarGroupConfig;
  idPrefix: string;
  collapsed: boolean;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  hrefFor: (path: string) => string;
  isActive: (path: string, exact?: boolean) => boolean;
  onNavigate?: () => void;
}) {
  const panelId = `portal-nav-${idPrefix}-${group.id}`;
  const content = (
    <div className={`${collapsed ? "lg:space-y-1" : "mt-1 space-y-1"}`}>
      {group.items.map((item) => (
        <SidebarLink
          key={item.path}
          href={hrefFor(item.path)}
          icon={item.icon}
          label={item.label}
          active={isActive(item.path, item.exact)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );

  return (
    <section className={collapsed ? "lg:border-t lg:border-white/10 lg:pt-3 first:lg:border-t-0 first:lg:pt-0" : ""}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
          collapsed ? "lg:sr-only" : ""
        } ${
          active
            ? "bg-signal/10 text-signal"
            : "text-white/34 hover:bg-white/[0.04] hover:text-white/62"
        }`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="truncate">{group.label}</span>
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] leading-none text-white/38">
            {group.items.length}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
        </span>
      </button>
      <div id={panelId} className={open || collapsed ? "" : "hidden"}>
        {content}
      </div>
    </section>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:gap-3 ${
        collapsed ? "lg:justify-center lg:px-0" : ""
      } ${
        active
          ? "bg-signal/15 text-signal shadow-[inset_0_0_0_1px_rgba(91,147,255,0.22)]"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
    </Link>
  );
}
