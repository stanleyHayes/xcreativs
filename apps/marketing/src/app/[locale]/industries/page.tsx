import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Building2,
  Factory,
  GraduationCap,
  HeartPulse,
  Landmark,
  Leaf,
  Network,
  ShieldCheck,
  Truck,
} from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";
import EmptyState from "@xc/ui/EmptyState";

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

const industryIcons: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /government|public|civic|ministry|municipal/i, icon: Landmark },
  { match: /financ|bank|insurance|capital|payments/i, icon: Banknote },
  { match: /health|care|hospital|clinic|medical/i, icon: HeartPulse },
  { match: /agric|food|farm|crop|land/i, icon: Leaf },
  { match: /education|school|university|learning/i, icon: GraduationCap },
  { match: /manufact|industrial|factory/i, icon: Factory },
  { match: /logistics|transport|supply|mobility/i, icon: Truck },
  { match: /security|defence|risk|compliance/i, icon: ShieldCheck },
  { match: /telecom|network|infrastructure/i, icon: Network },
];

function getIndustryIcon(industry: Industry): LucideIcon {
  const haystack = `${industry.Slug || ""} ${industry.Title || ""} ${industry.Description || ""}`;
  return industryIcons.find((entry) => entry.match.test(haystack))?.icon || Building2;
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
          <div className="col-span-full">
            <EmptyState
              icon={Building2}
              title="No industries available"
              description="Industry pages will appear here as they're published."
              compact
            />
          </div>
        )}
        {industries.map((ind: Industry) => {
          const Icon = getIndustryIcon(ind);
          return (
            <Link
              key={ind.Slug}
              href={`/industries/${ind.Slug}`}
              className="group card-x p-8"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-signal/20 bg-signal/8 text-signal transition-colors group-hover:border-signal/45 group-hover:bg-signal/12">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-semibold transition-colors group-hover:text-signal">
                {ind.Title}
              </h2>
              <p className="mt-2 text-gravity/60">{ind.Description}</p>
            </Link>
          );
        })}
        </div>
      </main>
    </>
  );
}
