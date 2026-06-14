import Link from "next/link";
import { Home, Compass, LifeBuoy, SatelliteDish } from "lucide-react";
import HeroBackdrop from "@/components/decor/HeroBackdrop";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[82vh] items-center overflow-hidden border-b border-hairline">
      <HeroBackdrop />
      <div className="shell-x relative py-24 text-center">
        <span className="animate-rise mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-foundation/70 text-signal shadow-sm backdrop-blur">
          <SatelliteDish className="h-7 w-7" />
        </span>

        <p className="text-gradient font-display text-[clamp(5rem,18vw,11rem)] font-semibold leading-none">
          404
        </p>

        <h1 className="animate-rise font-display mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">
          Signal lost.
        </h1>
        <p
          className="animate-rise mx-auto mt-4 max-w-md text-gravity/60"
          style={{ animationDelay: "0.1s" }}
        >
          This node isn&apos;t on the network. The page may have moved, been retired, or never
          existed. Let&apos;s get you back on a known route.
        </p>

        <div
          className="animate-rise mt-9 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.18s" }}
        >
          <Link
            href="/"
            className="btn-x group"
          >
            <Home className="h-4 w-4" />
            Back home
          </Link>
          <Link
            href="/services"
            className="btn-x-secondary"
          >
            <Compass className="h-4 w-4" />
            Explore services
          </Link>
          <Link
            href="/contact"
            className="btn-x-secondary"
          >
            <LifeBuoy className="h-4 w-4" />
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
