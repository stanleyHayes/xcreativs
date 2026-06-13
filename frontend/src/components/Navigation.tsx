"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Menu, X, Search, Sun, Moon, DollarSign } from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import { useTheme } from "./ThemeProvider";
import { useCurrency, CurrencyCode } from "./CurrencyProvider";

export default function Navigation() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/labs", label: t("labs") },
    { href: "/work", label: t("work") },
    { href: "/industries", label: t("industries") },
    { href: "/insights", label: t("insights") },
    { href: "/reading-list", label: "Reading List" },
    { href: "/audio-briefs", label: "Audio" },
    { href: "/webinars", label: "Webinars" },
    { href: "/careers", label: t("careers") },
    { href: "/partners", label: t("partners") },
    { href: "/tools", label: t("tools") },
    { href: "/contact", label: t("contact") },
  ];

  const otherLocale = locale === "en" ? "fr" : "en";

  return (
    <header className="sticky top-0 z-50 bg-foundation/90 backdrop-blur border-b border-hairline">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="XCreativs" width={28} height={28} className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">XCreativs</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-signal ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "text-signal"
                    : "text-gravity"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:text-signal transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:text-signal transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer hover:text-signal transition-colors"
              aria-label="Currency"
            >
              <option value="USD">USD</option>
              <option value="GHS">GHS</option>
              <option value="EUR">EUR</option>
            </select>
            <a
              href={`/${otherLocale}${pathname}`}
              className="text-xs font-medium uppercase tracking-wider text-gravity/60 hover:text-signal transition-colors"
            >
              {otherLocale.toUpperCase()}
            </a>
          </nav>

          <button
            className="lg:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-hairline bg-foundation">
          <div className="mx-auto max-w-[1440px] px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`text-base font-medium ${
                  pathname === l.href ? "text-signal" : "text-gravity"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={`/${otherLocale}${pathname}`}
              className="text-xs font-medium uppercase tracking-wider text-gravity/60"
            >
              {otherLocale.toUpperCase()}
            </a>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
