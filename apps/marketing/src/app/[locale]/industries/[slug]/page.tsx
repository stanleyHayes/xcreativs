"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import BannerWatermark from "@xc/ui/BannerWatermark";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";

interface CapabilityMappingItem {
  capability?: string;
  description?: string;
}

interface Industry {
  Title?: string;
  Description?: string;
  CapabilityMapping?: CapabilityMappingItem[];
  IntakeCTAText?: string;
}

export default function IndustryDetailPage() {
  const { slug } = useParams();
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getIndustry(slug as string).then((d) => { setIndustry(d as Industry); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!industry) return <div className="p-12 text-center">Industry not found</div>;

  const capabilities = industry.CapabilityMapping ?? [];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={Building2} />
        <div className="shell-x relative py-16 lg:py-24">
          <Link href="/industries" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" /> All Industries
          </Link>
          <p className="kicker-x text-signal">Industry dossier</p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
            {industry.Title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gravity/70">{industry.Description}</p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x py-16 lg:py-20">
          {capabilities.length > 0 && (
            <>
              <div className="max-w-2xl">
                <p className="kicker-x">Capability Mapping</p>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">How we serve this sector</h2>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {capabilities.map((cap, i) => (
                  <div key={i} className="card-x p-6">
                    <Building2 className="h-5 w-5 text-signal" />
                    <h3 className="mt-4 font-semibold">{cap.capability}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gravity/60">{cap.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link href="/contact" className="btn-x mt-10">
            {industry.IntakeCTAText || "Begin Engagement"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
