import Link from "next/link";
import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

export const metadata: Metadata = {
  title: "Labs — XCreativs Technologies",
  description:
    "The IP arm of XCreativs. Mandate → Build → License → Spin out. Real products, real platforms, real ownership.",
};

async function getLabs() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/labs`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { products: [] };
  return res.json();
}

export default async function LabsPage() {
  const data = await getLabs();
  const products = data.products || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">XCreativs Labs</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        The IP arm of XCreativs. Mandate → Build → License → Spin out. Real products, real platforms, real ownership.
      </p>
      <div className="mt-12 space-y-8">
        {products.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No lab products available yet.</p>
        )}
        {products.map((p: any) => (
          <Link
            key={p.Slug}
            href={`/labs/${p.Slug}`}
            className="group block border border-hairline rounded p-8 hover:border-signal transition-colors"
          >
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded bg-soft border border-hairline shrink-0">
                <FlaskConical className="w-6 h-6 text-signal" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold group-hover:text-signal transition-colors">
                  {p.Name}
                </h2>
                <p className="mt-1 text-signal font-medium">{p.Tagline}</p>
                <p className="mt-3 text-gravity/60">{p.ProblemStatement}</p>
                <div className="mt-4 flex gap-2">
                  {p.Sectors?.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-1 rounded bg-soft border border-hairline text-gravity/60">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
