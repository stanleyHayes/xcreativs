"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { Entity } from "@xc/api/types";
import BannerWatermark from "@xc/ui/BannerWatermark";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle, Clock, ReceiptText } from "lucide-react";

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
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={Briefcase} />
        <div className="shell-x relative py-16 lg:py-24">
          <Link href="/services" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" /> All Services
          </Link>
          <p className="kicker-x text-signal">Service line</p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
            {service.Title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gravity/70">{service.Summary}</p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-3 lg:py-20">
          <div className="space-y-8 lg:col-span-2">
            <section className="panel-x p-6 lg:p-8">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Methodology</h2>
              <ul className="mt-6 space-y-3">
                {service.Methodology?.map((m: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-gravity/70">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel-x p-6 lg:p-8">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Deliverables</h2>
              <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {service.Deliverables?.map((d: string, i: number) => (
                  <li key={i} className="rounded-2xl border border-hairline bg-foundation/80 p-4 text-sm text-gravity/70">
                    {d}
                  </li>
                ))}
              </ul>
            </section>

            {service.FAQs && service.FAQs.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold tracking-tight">FAQ</h2>
                <div className="mt-6 space-y-4">
                  {service.FAQs.map((faq: ServiceFAQ, i: number) => (
                    <div key={i} className="card-x p-5">
                      <p className="font-semibold">{faq.q}</p>
                      <p className="mt-2 text-sm leading-relaxed text-gravity/60">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="panel-x p-6">
              <Clock className="h-5 w-5 text-signal" />
              <p className="mt-4 kicker-x">Timeline</p>
              <p className="mt-1 text-xl font-semibold">{service.IndicativeTimeline}</p>
            </div>
            <div className="panel-x p-6">
              <ReceiptText className="h-5 w-5 text-signal" />
              <p className="mt-4 kicker-x">Indicative Price</p>
              <p className="mt-1 text-xl font-semibold">{service.IndicativePriceBand}</p>
            </div>
            <Link href="/contact" className="btn-x w-full">
              Begin Engagement <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
