import Link from "next/link";
import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Insights — XCreativs Technologies",
  description:
    "Long-form writing on digital systems, governance, and platform economics. No listicles. No fluff.",
};

async function getInsights() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/insights`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { insights: [] };
  return res.json();
}

export default async function InsightsPage() {
  const data = await getInsights();
  const insights = data.insights || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Insights</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Long-form writing on digital systems, governance, and platform economics. No listicles. No fluff.
      </p>
      <div className="mt-12 space-y-8">
        {insights.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No insights published yet.</p>
        )}
        {insights.map((i: any) => (
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
  );
}
