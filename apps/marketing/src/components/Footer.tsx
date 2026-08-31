"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  ArrowUp,
  Layers,
  Library,
  Building2,
  Scale,
  FlaskConical,
  Network,
  Wrench,
  FolderOpen,
  Newspaper,
  BookOpen,
  Headphones,
  Video,
  Compass,
  Users,
  Handshake,
  Mail,
  FileText,
  ShieldCheck,
  Lock,
} from "lucide-react";

type FooterLink = { href: string; label: string; icon: LucideIcon };
type FooterColumn = { title: string; icon: LucideIcon; links: FooterLink[] };

export default function Footer() {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  const locale = useLocale();
  const year = new Date().getFullYear();
  const localizeHref = (href: string) =>
    locale === "en" ? href : `/${locale}${href === "/" ? "" : href}`;

  const columns: FooterColumn[] = [
    {
      title: t("platform"),
      icon: Layers,
      links: [
        { href: "/services", label: n("services"), icon: Layers },
        { href: "/labs", label: n("labs"), icon: FlaskConical },
        { href: "/subsidiaries", label: n("subsidiaries"), icon: Network },
        { href: "/tools", label: n("tools"), icon: Wrench },
        { href: "/work", label: n("work"), icon: FolderOpen },
      ],
    },
    {
      title: t("resources"),
      icon: Library,
      links: [
        { href: "/insights", label: n("insights"), icon: Newspaper },
        { href: "/reading-list", label: n("readingList"), icon: BookOpen },
        { href: "/audio-briefs", label: n("audio"), icon: Headphones },
        { href: "/webinars", label: n("webinars"), icon: Video },
      ],
    },
    {
      title: t("company"),
      icon: Building2,
      links: [
        { href: "/about", label: n("about"), icon: Compass },
        { href: "/careers", label: n("careers"), icon: Users },
        { href: "/partners", label: n("partners"), icon: Handshake },
        { href: "/contact", label: n("contact"), icon: Mail },
      ],
    },
    {
      title: t("legal"),
      icon: Scale,
      links: [
        { href: "/legal/terms", label: t("terms"), icon: FileText },
        { href: "/legal/privacy", label: t("privacy"), icon: ShieldCheck },
        { href: "/legal/security", label: t("security"), icon: Lock },
      ],
    },
  ];

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden border-t border-signal bg-[#080c13] text-white">
      <div className="site-footer-rule-x h-px w-full opacity-80" />

      <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="grid gap-14 border-b border-white/10 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:py-20">
          <div>
            <Link href={localizeHref("/")} className="group flex items-center gap-2.5">
              <Image src="/logo.svg" alt="XCreativs" width={34} height={34} className="h-[34px] w-[34px]" />
              <span className="font-display text-2xl font-semibold tracking-[-0.05em]">XCreativs</span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">{t("tagline")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-white/60">
                <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                {t("sovereignty")}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-white/60">
                <Network className="h-3.5 w-3.5 text-signal" />
                {t("bilingual")}
              </span>
            </div>

            <Link
              href={localizeHref("/contact")}
              className="mt-8 inline-flex items-center gap-1.5 bg-white px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#080c13] transition-transform hover:-translate-y-0.5 hover:bg-signal hover:text-white"
            >
              {t("contact")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-4">
            {columns.map((col) => {
              const TitleIcon = col.icon;
              return (
                <div key={col.title}>
                  <p className="mb-5 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/38">
                    <TitleIcon className="h-3.5 w-3.5 text-signal" />
                    {col.title}
                  </p>
                  <ul className="space-y-2.5">
                    {col.links.map((l) => {
                      const LinkIcon = l.icon;
                      return (
                        <li key={l.href}>
                          <Link
                            href={localizeHref(l.href)}
                            className="flex items-center gap-2.5 text-sm text-white/58 transition-colors hover:text-signal"
                          >
                            <LinkIcon className="site-footer-link-icon-x h-4 w-4 transition-colors" />
                            {l.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex flex-col justify-between gap-4 py-5 pl-12 pr-24 dark:border-white/10 sm:flex-row sm:items-center lg:pl-16 lg:pr-28">
          <p className="site-footer-faint-x text-xs">{t("rights", { year })}</p>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span className="site-footer-faint-x text-xs">{t("confidential")}</span>
            <button
              type="button"
              onClick={scrollTop}
              className="site-footer-back-x inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {t("backToTop")}
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
