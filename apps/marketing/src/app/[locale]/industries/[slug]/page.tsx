"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft } from "lucide-react";

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
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/industries" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Industries
      </Link>
      <h1 className="text-3xl lg:text-5xl font-bold">{industry.Title}</h1>
      <p className="mt-6 text-lg text-gravity/70 max-w-3xl">{industry.Description}</p>

      {capabilities.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Capability Mapping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((cap, i) => (
              <div key={i} className="border border-hairline rounded p-6">
                <h3 className="font-semibold">{cap.capability}</h3>
                <p className="mt-1 text-sm text-gravity/60">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {industry.IntakeCTAText || "Begin Engagement"}
        </Link>
      </div>
    </main>
  );
}
