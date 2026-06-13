import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Services — XCreativs Technologies",
  description:
    "Five service lines: Strategy & Advisory, Platform Engineering, AI & Data Systems, Digital Operations, and Sovereign Infrastructure. Each engineered beyond brochure.",
};

async function getServices() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/services`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { services: [] };
  return res.json();
}

export default async function ServicesPage() {
  const data = await getServices();
  const services = data.services || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Services</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Five service lines, each engineered beyond brochure. Every page includes methodology, deliverables, indicative timeline, and sample dossiers.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.length === 0 && (
          <p className="text-center text-gravity/40 py-12 col-span-full">No services published yet.</p>
        )}
        {services.map((s: any) => (
          <Link
            key={s.Slug}
            href={`/services/${s.Slug}`}
            className="group border border-hairline rounded p-8 hover:border-signal transition-colors"
          >
            <Briefcase className="w-5 h-5 text-signal mb-4" />
            <h2 className="text-xl font-semibold group-hover:text-signal transition-colors">
              {s.Title}
            </h2>
            <p className="mt-2 text-gravity/60">{s.Summary}</p>
            <div className="mt-4 flex gap-4 text-xs text-gravity/40">
              <span>{s.IndicativeTimeline}</span>
              <span>{s.IndicativePriceBand}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
