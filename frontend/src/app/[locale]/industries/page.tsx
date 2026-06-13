import Link from "next/link";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Industries — XCreativs Technologies",
  description:
    "Sector-specific digital systems for government, financial services, healthcare, agriculture, and education.",
};

async function getIndustries() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/industries`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { industries: [] };
  return res.json();
}

export default async function IndustriesPage() {
  const data = await getIndustries();
  const industries = data.industries || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Industries</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Sector-specific digital systems. We do not claim to serve every industry — only the ones where we have depth.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {industries.length === 0 && (
          <p className="text-center text-gravity/40 py-12 col-span-full">No industry pages available yet.</p>
        )}
        {industries.map((ind: any) => (
          <Link
            key={ind.Slug}
            href={`/industries/${ind.Slug}`}
            className="group border border-hairline rounded p-8 hover:border-signal transition-colors"
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
  );
}
