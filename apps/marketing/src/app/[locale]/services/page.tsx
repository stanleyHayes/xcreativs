import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

export const metadata: Metadata = {
  title: "Services — XCreativs Technologies",
  description:
    "Five service lines: Strategy & Advisory, Platform Engineering, AI & Data Systems, Digital Operations, and Sovereign Infrastructure. Each engineered beyond brochure.",
};

interface Service {
  Slug: string;
  Title: string;
  Summary: string;
  IndicativeTimeline: string;
  IndicativePriceBand: string;
}

interface ServicesResponse {
  services?: Service[];
}

async function getServices(): Promise<ServicesResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/services`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { services: [] };
  return (await res.json()) as ServicesResponse;
}

export default async function ServicesPage() {
  const data = await getServices();
  const services = data.services || [];

  return (
    <>
      <PageBanner
        icon={Briefcase}
        eyebrow="What we build"
        title="Services"
        description="Five service lines, each engineered beyond brochure. Every page includes methodology, deliverables, indicative timeline, and sample dossiers."
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
      />
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.length === 0 && (
          <p className="text-center text-gravity/40 py-12 col-span-full">No services published yet.</p>
        )}
        {services.map((s: Service) => (
          <Link
            key={s.Slug}
            href={`/services/${s.Slug}`}
            className="group card-x p-8"
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
    </>
  );
}
