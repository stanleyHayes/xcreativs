"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronDown,
  ArrowUpRight,
  Layers,
  Building2,
  FlaskConical,
  Wrench,
  Newspaper,
  BookOpen,
  Headphones,
  Video,
  Compass,
  Users,
  Handshake,
  Network,
} from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import { useTheme } from "./ThemeProvider";
import { useCurrency, CurrencyCode } from "./CurrencyProvider";

type MenuItem = { href: string; label: string; desc: string; icon: LucideIcon };
type MenuGroup = { key: string; label: string; tagline: string; items: MenuItem[] };

export default function Navigation() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const groups: MenuGroup[] = [
    {
      key: "services",
      label: t("services"),
      tagline: t("groupServices"),
      items: [
        { href: "/services", label: t("services"), desc: t("servicesDesc"), icon: Layers },
        { href: "/industries", label: t("industries"), desc: t("industriesDesc"), icon: Building2 },
        { href: "/labs", label: t("labs"), desc: t("labsDesc"), icon: FlaskConical },
        { href: "/tools", label: t("tools"), desc: t("toolsDesc"), icon: Wrench },
      ],
    },
    {
      key: "insights",
      label: t("insights"),
      tagline: t("groupInsights"),
      items: [
        { href: "/insights", label: t("insights"), desc: t("insightsDesc"), icon: Newspaper },
        { href: "/reading-list", label: t("readingList"), desc: t("readingListDesc"), icon: BookOpen },
        { href: "/audio-briefs", label: t("audio"), desc: t("audioDesc"), icon: Headphones },
        { href: "/webinars", label: t("webinars"), desc: t("webinarsDesc"), icon: Video },
      ],
    },
    {
      key: "company",
      label: t("company"),
      tagline: t("groupCompany"),
      items: [
        { href: "/about", label: t("about"), desc: t("aboutDesc"), icon: Compass },
        { href: "/careers", label: t("careers"), desc: t("careersDesc"), icon: Users },
        { href: "/partners", label: t("partners"), desc: t("partnersDesc"), icon: Handshake },
        { href: "/subsidiaries", label: t("subsidiaries"), desc: t("subsidiariesDesc"), icon: Network },
      ],
    },
  ];

  const otherLocale = locale === "en" ? "fr" : "en";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const groupActive = (g: MenuGroup) => g.items.some((i) => isActive(i.href));

  return (
    <header className="sticky top-0 z-50">
      <div className="h-[3px] w-full bg-gradient-to-r from-signal via-signal/40 to-transparent" />
      <div className="border-b border-hairline bg-foundation/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <div className="flex h-[68px] items-center justify-between gap-6">
            {/* Wordmark */}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="group flex shrink-0 items-center gap-2.5"
            >
              <Image
                src="/logo.svg"
                alt="XCreativs"
                width={32}
                height={32}
                priority
                className="h-8 w-8 transition-transform duration-300 group-hover:rotate-[8deg]"
              />
              <span className="font-display text-[22px] font-semibold leading-none tracking-tight">
                XCreativs
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav
              className="hidden items-center gap-0.5 lg:flex"
              onMouseLeave={() => setOpenMenu(null)}
            >
              {groups.map((g) => (
                <div
                  key={g.key}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(g.key)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === g.key ? null : g.key)}
                    aria-expanded={openMenu === g.key}
                    className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      groupActive(g) || openMenu === g.key
                        ? "text-signal"
                        : "text-gravity/80 hover:text-gravity"
                    }`}
                  >
                    {g.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        openMenu === g.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openMenu === g.key && (
                    <div className="animate-pop absolute left-0 top-full pt-2.5">
                      <div className="w-[460px] rounded-2xl border border-hairline bg-foundation/95 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                        <p className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-mist">
                          {g.tagline}
                        </p>
                        <div className="grid grid-cols-1 gap-0.5">
                          {g.items.map((i) => {
                            const Icon = i.icon;
                            return (
                              <Link
                                key={i.href}
                                href={i.href}
                                onClick={() => setOpenMenu(null)}
                                className="group/item flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-soft"
                              >
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-foundation text-signal transition-colors group-hover/item:border-signal/40">
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="min-w-0">
                                  <span className="flex items-center gap-1 text-sm font-semibold text-gravity">
                                    {i.label}
                                    <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-60" />
                                  </span>
                                  <span className="block truncate text-xs text-mist">{i.desc}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/work"
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive("/work") ? "text-signal" : "text-gravity/80 hover:text-gravity"
                }`}
              >
                {t("work")}
              </Link>
            </nav>

            {/* Right cluster */}
            <div className="hidden items-center gap-1 lg:flex">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label={t("search")}
                className="rounded-full p-2 text-gravity/70 transition-colors hover:bg-soft hover:text-gravity"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-full p-2 text-gravity/70 transition-colors hover:bg-soft hover:text-gravity"
              >
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                aria-label="Currency"
                className="cursor-pointer rounded-full bg-transparent px-1.5 py-1 text-xs font-medium text-gravity/70 transition-colors hover:text-gravity focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="GHS">GHS</option>
                <option value="EUR">EUR</option>
              </select>
              <a
                href={`/${otherLocale}${pathname}`}
                className="rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wider text-mist transition-colors hover:text-signal"
              >
                {otherLocale}
              </a>
              <Link
                href="/contact"
                className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gravity px-4 py-2 text-sm font-semibold text-foundation transition-transform hover:-translate-y-0.5 hover:bg-signal"
              >
                {t("contact")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="rounded-full p-2 text-gravity lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? t("close") : t("menu")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="max-h-[calc(100vh-71px)] overflow-y-auto border-b border-hairline bg-foundation lg:hidden">
          <div className="mx-auto max-w-[1440px] px-5 py-5">
            <Link
              href="/work"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-semibold hover:bg-soft"
            >
              {t("work")}
            </Link>
            {groups.map((g) => (
              <div key={g.key} className="mt-4">
                <p className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-mist">
                  {g.label}
                </p>
                <div className="mt-1">
                  {g.items.map((i) => {
                    const Icon = i.icon;
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-soft"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-signal">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{i.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    setSearchOpen(true);
                  }}
                  aria-label={t("search")}
                  className="rounded-full p-2 hover:bg-soft"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full p-2 hover:bg-soft">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <a
                  href={`/${otherLocale}${pathname}`}
                  className="rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wider text-mist"
                >
                  {otherLocale}
                </a>
              </div>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gravity px-4 py-2.5 text-sm font-semibold text-foundation"
              >
                {t("contact")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
