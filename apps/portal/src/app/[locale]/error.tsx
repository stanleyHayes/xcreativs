"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, LogIn } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console / monitoring without exposing details to the user.
    console.error("Portal error boundary:", error);
  }, [error]);

  return (
    <main className="grid min-h-[80vh] place-items-center bg-gravity px-6 text-foundation">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-signal">
          <AlertTriangle className="h-7 w-7" />
        </span>

        <h1 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
          That didn’t go through
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Something interrupted that step — not anything you did. Your work is safe.
          Give it another try, and if it keeps happening, sign in again or come back
          in a moment.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-signal/25 transition-transform hover:-translate-y-0.5 hover:bg-signal-ink"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
          >
            <LogIn className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        {error.digest && (
          <p className="mt-7 text-[11px] uppercase tracking-[0.15em] text-white/30">
            Reference {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
