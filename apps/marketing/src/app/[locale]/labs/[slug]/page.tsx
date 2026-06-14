"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft, ArrowRight, Cpu, FlaskConical, Target } from "lucide-react";

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
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_75%_10%,black,transparent_70%)]" />
        <div className="shell-x relative py-16 lg:py-24">
          <Link href="/labs" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" /> All Labs Products
          </Link>
          <p className="kicker-x text-signal">Labs product</p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
            {product.Name}
          </h1>
          <p className="mt-4 max-w-2xl text-xl font-medium text-signal">{product.Tagline}</p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-3 lg:py-20">
          <div className="space-y-6 lg:col-span-2">
            <StoryPanel icon={Target} title="The Problem" content={product.ProblemStatement} />
            <StoryPanel icon={FlaskConical} title="The Platform" content={product.PlatformDescription} />
            {product.TechnicalArchitectureOverview && (
              <StoryPanel icon={Cpu} title="Technical Architecture" content={product.TechnicalArchitectureOverview} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="panel-x p-6">
              <p className="kicker-x mb-4">Sectors</p>
              <div className="flex flex-wrap gap-2">
                {product.Sectors?.map((s: string) => (
                  <span key={s} className="chip-x">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/contact" className="btn-x w-full">
              Request Access <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StoryPanel({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content?: string }) {
  return (
    <section className="panel-x p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-hairline bg-foundation text-signal">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="prose-x mt-5">{content}</p>
    </section>
  );
}
