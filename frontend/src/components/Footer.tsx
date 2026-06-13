"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-foundation">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="XCreativs" width={28} height={28} className="h-7 w-7" />
              <p className="text-xl font-bold tracking-tight">XCreativs</p>
            </div>
            <p className="mt-2 text-sm text-gravity/60 max-w-sm">
              Intelligent digital systems for governments and enterprises.
              National-scale platforms, AI integration, and strategic advisory.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">
              Platform
            </p>
            <ul className="space-y-2">
              {[
                { href: "/services", label: "Services" },
                { href: "/labs", label: "Labs" },
                { href: "/subsidiaries", label: "Subsidiaries" },
                { href: "/work", label: "Work" },
                { href: "/insights", label: "Insights" },
                { href: "/careers", label: "Careers" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gravity/80 hover:text-signal transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">
              {t("legal")}
            </p>
            <ul className="space-y-2">
              {[
                { href: "/legal/terms", label: t("terms") },
                { href: "/legal/privacy", label: t("privacy") },
                { href: "/legal/security", label: t("security") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gravity/80 hover:text-signal transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gravity/40">
            {t("rights", { year })}
          </p>
          <p className="text-xs text-gravity/40">
            Internal · Confidential
          </p>
        </div>
      </div>
    </footer>
  );
}
