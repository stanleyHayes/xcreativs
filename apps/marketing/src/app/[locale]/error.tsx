"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, LifeBuoy } from "lucide-react";
import HeroBackdrop from "@/components/decor/HeroBackdrop";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing error boundary:", error);
  }, [error]);

  return (
    <main className="relative isolate flex min-h-[82vh] items-center overflow-hidden border-b border-hairline">
      <HeroBackdrop />
      <div className="shell-x relative py-24 text-center">
        <span className="animate-rise mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-foundation/70 text-signal shadow-sm backdrop-blur">
          <LifeBuoy className="h-7 w-7" />
        </span>

        <h1 className="animate-rise font-display mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">
          Something went sideways
        </h1>
        <p
          className="animate-rise mx-auto mt-4 max-w-md text-gravity/60"
          style={{ animationDelay: "0.1s" }}
        >
          A hiccup on our end interrupted that request — nothing you did. Give it
          another try, and if it keeps happening, head back home and we&apos;ll get you
          moving again.
        </p>

        <div
          className="animate-rise mt-9 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.18s" }}
        >
          <button onClick={() => reset()} className="btn-x group">
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="btn-x-secondary">
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </div>

        {error.digest && (
          <p
            className="animate-rise mt-7 text-[11px] uppercase tracking-[0.15em] text-gravity/40"
            style={{ animationDelay: "0.24s" }}
          >
            Reference {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
