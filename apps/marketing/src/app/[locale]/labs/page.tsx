import Link from "next/link";
import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";
import EmptyState from "@xc/ui/EmptyState";

export const metadata: Metadata = {
  title: "Labs — XCreativs Technologies",
  description:
    "The IP arm of XCreativs. Mandate → Build → License → Spin out. Real products, real platforms, real ownership.",
};

interface LabProduct {
  Slug: string;
  Name: string;
  Tagline?: string;
  ProblemStatement?: string;
  Sectors?: string[];
}

interface LabsResponse {
  products: LabProduct[];
}

async function getLabs(): Promise<LabsResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/labs`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { products: [] };
  return res.json() as Promise<LabsResponse>;
}

export default async function LabsPage() {
  const data = await getLabs();
  const products = data.products || [];

  return (
    <>
      <PageBanner
        icon={FlaskConical}
        eyebrow="Product ventures"
        title="XCreativs Labs"
        description="The IP arm of XCreativs. Mandate → Build → License → Spin out. Real products, real platforms, real ownership."
        crumbs={[{ label: "Home", href: "/" }, { label: "XCreativs Labs" }]}
      />
      <main className="shell-x py-16">
        <div className="mt-12 space-y-8">
        {products.length === 0 && (
          <EmptyState
            icon={FlaskConical}
            title="No lab products yet"
            description="Lab products will appear here as they move from research into the open."
          />
        )}
        {products.map((p) => (
          <Link
            key={p.Slug}
            href={`/labs/${p.Slug}`}
            className="group card-x block p-8"
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
    </>
  );
}
