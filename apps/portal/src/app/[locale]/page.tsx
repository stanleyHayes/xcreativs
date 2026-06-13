import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

export default async function PortalLanding() {
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gravity/40">XCreativs</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Portal</h1>
        <p className="mt-3 max-w-sm text-gravity/60">
          Your client and admin workspace. Sign in to manage engagements, documents, and more.
        </p>
      </div>
      <Link
        href={`/${locale}/login`}
        className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-signal/90"
      >
        Sign in
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
