"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft } from "lucide-react";

interface LabProduct {
  Name?: string;
  Tagline?: string;
  ProblemStatement?: string;
  PlatformDescription?: string;
  TechnicalArchitectureOverview?: string;
  Sectors?: string[];
}

export default function LabsDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<LabProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getLabProduct(slug as string).then((d) => { setProduct(d as LabProduct); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!product) return <div className="p-12 text-center">Product not found</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/labs" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Labs Products
      </Link>
      <h1 className="text-3xl lg:text-5xl font-bold">{product.Name}</h1>
      <p className="mt-2 text-xl text-signal font-medium">{product.Tagline}</p>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-3">The Problem</h2>
            <p className="text-gravity/70 leading-relaxed">{product.ProblemStatement}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">The Platform</h2>
            <p className="text-gravity/70 leading-relaxed">{product.PlatformDescription}</p>
          </section>
          {product.TechnicalArchitectureOverview && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Technical Architecture</h2>
              <p className="text-gravity/70 leading-relaxed">{product.TechnicalArchitectureOverview}</p>
            </section>
          )}
        </div>
        <aside className="space-y-6">
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-3">Sectors</p>
            <div className="flex flex-wrap gap-2">
              {product.Sectors?.map((s: string) => (
                <span key={s} className="text-xs px-2 py-1 rounded bg-soft border border-hairline text-gravity/60">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/contact"
            className="block text-center bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Request Access
          </Link>
        </aside>
      </div>
    </main>
  );
}
