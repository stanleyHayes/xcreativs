import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import BannerWatermark from "./BannerWatermark";

export type Crumb = { label: string; href?: string };

type PageBannerProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  eyebrow?: string;
  crumbs?: Crumb[];
  /** Optional alignment for content-heavy hubs */
  align?: "left" | "center";
};

export default function PageBanner({
  icon: Icon,
  title,
  description,
  eyebrow,
  crumbs,
  align = "left",
}: PageBannerProps) {
  const centered = align === "center";

  return (
    <section className="relative isolate overflow-hidden border-b border-hairline bg-soft/90">
      <BannerWatermark icon={Icon} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-hairline lg:block" />

      <div
        className={`relative mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24 ${
          centered ? "text-center" : ""
        }`}
      >
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className={`animate-rise mb-6 flex items-center gap-1.5 text-xs font-medium text-gravity/45 ${
              centered ? "justify-center" : ""
            }`}
          >
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-gravity/30" />}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-signal">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-gravity/75">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div
          className={`flex items-start gap-5 ${centered ? "flex-col items-center" : "max-w-5xl"}`}
        >
          <span
            className="animate-rise relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-hairline bg-foundation text-signal"
            style={{ animationDelay: "0.05s" }}
          >
            <Icon className="h-7 w-7" />
          </span>

          <div className={centered ? "max-w-2xl" : ""}>
            {eyebrow && (
              <p className="context-label-x animate-rise mb-3">
                {eyebrow}
              </p>
            )}
            <h1
              className="animate-rise text-balance font-display text-4xl font-semibold leading-[1.03] tracking-tight lg:text-6xl"
              style={{ animationDelay: "0.08s" }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="animate-rise mt-4 max-w-2xl text-base leading-relaxed text-gravity/60 lg:text-lg"
                style={{ animationDelay: "0.16s" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div aria-hidden className="rule-x absolute inset-x-0 bottom-0 h-px opacity-80" />
    </section>
  );
}
