import Link from "next/link";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

export const metadata: Metadata = {
  title: "Industries — XCreativs Technologies",
  description:
    "Sector-specific digital systems for government, financial services, healthcare, agriculture, and education.",
};

interface Industry {
  Slug?: string;
  Title?: string;
  Description?: string;
}

interface IndustriesResponse {
  industries?: Industry[];
}

async function getIndustries(): Promise<IndustriesResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/industries`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { industries: [] };
  return res.json() as Promise<IndustriesResponse>;
}

export default async function IndustriesPage() {
  const data = await getIndustries();
  const industries = data.industries || [];

  return (
    <>
      <PageBanner
        icon={Building2}
        eyebrow="Sectors we serve"
        title="Industries"
        description="Sector-specific digital systems. We do not claim to serve every industry — only the ones where we have depth."
        crumbs={[{ label: "Home", href: "/" }, { label: "Industries" }]}
      />
      <main className="shell-x py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {industries.length === 0 && (
          <p className="text-center text-gravity/40 py-12 col-span-full">No industry pages available yet.</p>
        )}
        {industries.map((ind: Industry) => (
          <Link
            key={ind.Slug}
            href={`/industries/${ind.Slug}`}
            className="group card-x p-8"
          >
            <Building2 className="w-5 h-5 text-signal mb-4" />
            <h2 className="text-xl font-semibold group-hover:text-signal transition-colors">
              {ind.Title}
            </h2>
            <p className="mt-2 text-gravity/60">{ind.Description}</p>
          </Link>
        ))}
        </div>
      </main>
    </>
  );
}
