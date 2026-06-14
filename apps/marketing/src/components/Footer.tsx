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
    <footer className="bg-grain relative overflow-hidden bg-[#0b0b0d] text-[#f3f1ea]">
      <div className="h-px w-full rule-x opacity-60" />

      {/* faint engineering grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 pb-16 pt-16 lg:grid-cols-12">
          {/* Brand block */}
          <div className="col-span-2 lg:col-span-4 lg:pr-10">
            <Link href={localizeHref("/")} className="group flex items-center gap-2.5">
              <Image src="/logo.svg" alt="XCreativs" width={34} height={34} className="h-[34px] w-[34px]" />
              <span className="font-display text-2xl font-semibold tracking-tight">XCreativs</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#f3f1ea]/55">{t("tagline")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wide text-[#f3f1ea]/70">
                <ShieldCheck className="h-3.5 w-3.5 text-[#5b93ff]" />
                {t("sovereignty")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-wide text-[#f3f1ea]/70">
                <Network className="h-3.5 w-3.5 text-[#5b93ff]" />
                {t("bilingual")}
              </span>
            </div>

            <Link
              href={localizeHref("/contact")}
              className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-[#f3f1ea] px-4 py-2 text-sm font-semibold text-[#0b0b0d] transition-transform hover:-translate-y-0.5 hover:bg-[#5b93ff] hover:text-white"
            >
              {t("contact")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Link columns */}
          {columns.map((col) => {
            const TitleIcon = col.icon;
            return (
              <div key={col.title} className="lg:col-span-2">
                <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f3f1ea]/45">
                  <TitleIcon className="h-3.5 w-3.5 text-[#5b93ff]" />
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => {
                    const LinkIcon = l.icon;
                    return (
                      <li key={l.href}>
                        <Link
                          href={localizeHref(l.href)}
                          className="group/link flex items-center gap-2.5 text-sm text-[#f3f1ea]/65 transition-colors hover:text-[#5b93ff]"
                        >
                          <LinkIcon className="h-4 w-4 text-[#f3f1ea]/30 transition-colors group-hover/link:text-[#5b93ff]" />
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

        {/* Oversized editorial watermark */}
        <div className="pointer-events-none select-none overflow-hidden">
          <span className="font-display block translate-y-[18%] whitespace-nowrap text-[20vw] font-semibold leading-none tracking-tight text-[#f3f1ea]/[0.035] lg:text-[15vw]">
            XCreativs
          </span>
        </div>

        {/* Bottom bar */}
        <div className="relative flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 sm:flex-row">
          <p className="text-xs text-[#f3f1ea]/45">{t("rights", { year })}</p>
          <div className="flex items-center gap-5">
            <span className="text-xs text-[#f3f1ea]/35">{t("confidential")}</span>
            <button
              type="button"
              onClick={scrollTop}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-[#f3f1ea]/70 transition-colors hover:border-[#5b93ff]/50 hover:text-[#5b93ff]"
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
