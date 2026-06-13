import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gravity text-foundation">
      <div className="text-center px-6">
        <p className="text-6xl font-bold text-signal mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-signal text-white rounded font-medium hover:bg-signal/90 transition-colors"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
