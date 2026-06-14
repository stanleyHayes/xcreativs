import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Newspaper } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

export const metadata: Metadata = {
  title: "Insights — XCreativs Technologies",
  description:
    "Long-form writing on digital systems, governance, and platform economics. No listicles. No fluff.",
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/api/v1/feed/insights", title: "XCreativs Insights — RSS" },
      ],
    },
  },
};

interface InsightSummary {
  Slug: string;
  ContentType: string;
  AuthorName: string;
  Title: string;
  Summary: string;
}

interface InsightsResponse {
  insights: InsightSummary[];
}

async function getInsights(): Promise<InsightsResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/insights`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { insights: [] };
  return res.json() as Promise<InsightsResponse>;
}

export default async function InsightsPage() {
  const data = await getInsights();
  const insights = data.insights || [];

  return (
    <>
      <PageBanner
        icon={Newspaper}
        eyebrow="Ideas & research"
        title="Insights"
        description="Long-form writing on digital systems, governance, and platform economics. No listicles. No fluff."
        crumbs={[{ label: "Home", href: "/" }, { label: "Insights" }]}
      />
      <main className="shell-x py-16">
        <div className="mt-12 space-y-8">
          {insights.length === 0 && (
            <p className="text-center text-gravity/40 py-12">No insights published yet.</p>
          )}
          {insights.map((i: InsightSummary) => (
            <Link
              key={i.Slug}
              href={`/insights/${i.Slug}`}
              className="group block border-b border-hairline pb-8 hover:border-signal transition-colors"
            >
              <div className="flex items-start gap-4">
                <FileText className="w-5 h-5 text-signal shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-signal mb-1">
                    {i.ContentType} · {i.AuthorName}
                  </p>
                  <h2 className="text-xl font-semibold group-hover:text-signal transition-colors">
                    {i.Title}
                  </h2>
                  <p className="mt-2 text-gravity/60 line-clamp-3">{i.Summary}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
