"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Entity } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface ServiceFAQ {
  q?: string;
  a?: string;
}

interface ServiceDetail {
  Title?: string;
  Summary?: string;
  Methodology?: string[];
  Deliverables?: string[];
  FAQs?: ServiceFAQ[];
  IndicativeTimeline?: string;
  IndicativePriceBand?: string;
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getService(slug as string).then((d) => {
      setService(d as Entity as ServiceDetail);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!service) return <div className="p-12 text-center">Service not found</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/services" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Services
      </Link>
      <h1 className="text-3xl lg:text-5xl font-bold">{service.Title}</h1>
      <p className="mt-6 text-lg text-gravity/70 max-w-3xl">{service.Summary}</p>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-4">Methodology</h2>
            <ul className="list-disc list-inside space-y-2 text-gravity/70">
              {service.Methodology?.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">Deliverables</h2>
            <ul className="list-disc list-inside space-y-2 text-gravity/70">
              {service.Deliverables?.map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </section>
          {service.FAQs && service.FAQs.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">FAQ</h2>
              <div className="space-y-4">
                {service.FAQs.map((faq: ServiceFAQ, i: number) => (
                  <div key={i} className="border border-hairline rounded p-4">
                    <p className="font-medium">{faq.q}</p>
                    <p className="mt-1 text-sm text-gravity/60">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-6">
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Timeline</p>
            <p className="mt-1 text-lg font-semibold">{service.IndicativeTimeline}</p>
          </div>
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Indicative Price</p>
            <p className="mt-1 text-lg font-semibold">{service.IndicativePriceBand}</p>
          </div>
          <Link
            href="/contact"
            className="block text-center bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Begin Engagement
          </Link>
        </aside>
      </div>
    </main>
  );
}
