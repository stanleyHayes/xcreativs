import Link from "next/link";
import { ArrowRight, Compass, Home, LifeBuoy, SatelliteDish } from "lucide-react";

export default function PortalNotFoundScreen() {
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

  return (
    <main className="portal-shell-x relative isolate flex min-h-screen items-center overflow-hidden bg-gravity text-foundation">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.045]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-signal/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-52 bottom-[-12rem] h-[30rem] w-[30rem] rounded-full bg-white/8 blur-[120px]"
      />

      <section className="relative mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            <SatelliteDish className="h-4 w-4 text-signal" />
            Route signal lost
          </span>

          <p className="font-display mt-10 text-[clamp(5.5rem,22vw,15rem)] font-semibold leading-[0.78] tracking-tight text-white/95">
            404
          </p>
          <h1 className="font-display mt-8 max-w-3xl text-4xl font-semibold leading-none tracking-tight sm:text-5xl lg:text-6xl">
            This portal room is not available.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/58 lg:text-lg">
            The page may have moved, your access may not include it, or the route was typed incorrectly.
            Let&apos;s get you back to a known workspace surface.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/portal" className="portal-btn-x">
              <Home className="h-4 w-4" />
              Back to portal
            </Link>
            <a href={`${siteURL}/careers`} className="portal-btn-secondary-x">
              <Compass className="h-4 w-4" />
              Browse open roles
            </a>
          </div>
        </div>

        <aside className="portal-panel-x p-5">
          <p className="portal-meta-x text-signal">Recovery options</p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Portal overview", href: "/portal", icon: Home },
              { label: "Public website", href: siteURL, icon: Compass },
              { label: "Contact support", href: `${siteURL}/contact`, icon: LifeBuoy },
            ].map((item) => {
              const Icon = item.icon;
              const external = item.href.startsWith("http");
              const className = "portal-card-x group flex items-center justify-between gap-4 p-4 transition-colors hover:border-signal/45";
              const content = (
                <>
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-signal">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/28 transition-transform group-hover:translate-x-0.5 group-hover:text-signal" />
                </>
              );

              return external ? (
                <a key={item.label} href={item.href} className={className}>
                  {content}
                </a>
              ) : (
                <Link key={item.label} href={item.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
