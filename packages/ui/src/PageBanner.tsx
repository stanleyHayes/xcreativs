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
    <section className="relative isolate overflow-hidden border-b border-hairline bg-foundation">
      <BannerWatermark icon={Icon} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[7.5%] hidden w-px bg-hairline lg:block" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[7.5%] hidden w-px bg-hairline lg:block" />

      <div
        className={`relative mx-auto max-w-[1536px] px-6 py-14 lg:px-[7.5%] lg:py-24 ${
          centered ? "text-center" : ""
        }`}
      >
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className={`animate-rise mb-10 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gravity/45 ${
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
          className={`grid gap-7 ${centered ? "justify-items-center" : "max-w-6xl lg:grid-cols-[6rem_1fr] lg:gap-10"}`}
        >
          <span
            className="animate-rise relative flex h-16 w-16 shrink-0 items-center justify-center border border-signal bg-signal text-white lg:h-24 lg:w-24"
            style={{ animationDelay: "0.05s" }}
          >
            <Icon className="h-7 w-7 lg:h-9 lg:w-9" strokeWidth={1.5} />
          </span>

          <div className={centered ? "max-w-2xl" : ""}>
            {eyebrow && (
              <p className="context-label-x animate-rise mb-3">
                {eyebrow}
              </p>
            )}
            <h1
              className="animate-rise text-balance font-display text-5xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl lg:text-[5.8rem]"
              style={{ animationDelay: "0.08s" }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="animate-rise mt-6 max-w-2xl border-l-2 border-signal pl-5 text-base leading-relaxed text-gravity/62 lg:text-lg"
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
