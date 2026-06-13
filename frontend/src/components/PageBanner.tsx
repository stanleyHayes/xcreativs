import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

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
    <section className="relative isolate overflow-hidden border-b border-hairline bg-soft">
      {/* decorative atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-drift absolute -right-[8%] -top-[55%] h-[42vmax] w-[42vmax] rounded-full bg-signal/10 blur-[120px]" />
        <div className="animate-float absolute -left-[10%] bottom-[-60%] h-[34vmax] w-[34vmax] rounded-full bg-signal/[0.06] blur-[120px]" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_75%_25%,black,transparent_70%)]" />
        <div className="bg-grain absolute inset-0 opacity-40" />
        {/* corner constellation */}
        <svg
          className="absolute right-0 top-0 h-44 w-44 text-signal/25"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={0.5}
        >
          <path d="M20 20 L55 30 L40 60 L75 50 L60 85" />
          <path d="M55 30 L75 50" />
          {[
            [20, 20],
            [55, 30],
            [40, 60],
            [75, 50],
            [60, 85],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.6} fill="currentColor" stroke="none" />
          ))}
        </svg>
      </div>

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
          className={`flex items-start gap-5 ${centered ? "flex-col items-center" : ""}`}
        >
          <span
            className="animate-rise relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-foundation text-signal shadow-sm"
            style={{ animationDelay: "0.05s" }}
          >
            <Icon className="h-7 w-7" />
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-signal"
              style={{ animation: "xc-pulse 4s ease-in-out infinite" }}
            />
          </span>

          <div className={centered ? "max-w-2xl" : ""}>
            {eyebrow && (
              <p className="animate-rise mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                {eyebrow}
              </p>
            )}
            <h1
              className="animate-rise font-display text-4xl font-semibold leading-[1.03] tracking-tight lg:text-6xl"
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
    </section>
  );
}
