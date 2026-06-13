import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Work — XCreativs Technologies",
  description:
    "Selected case dossiers from national-scale engagements. Each includes the problem, our approach, and measurable outcomes.",
};

async function getWork() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/work`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { dossiers: [] };
  return res.json();
}

export default async function WorkPage() {
  const data = await getWork();
  const items = data.dossiers || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Work</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Selected case dossiers. Not a portfolio — a record of what happens when capability meets mandate.
      </p>
      <div className="mt-12 space-y-8">
        {items.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No case studies available yet.</p>
        )}
        {items.map((item: any) => (
          <Link
            key={item.Slug}
            href={`/work/${item.Slug}`}
            className="group block border border-hairline rounded p-8 hover:border-signal transition-colors"
          >
            <div className="flex items-start gap-4">
              <FolderOpen className="w-5 h-5 text-signal shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold group-hover:text-signal transition-colors">
                  {item.Title}
                </h2>
                <p className="mt-1 text-sm text-gravity/60">
                  {item.ClientName} · {item.Industry} · {item.Stage}
                </p>
                <p className="mt-2 text-gravity/60">{item.Brief}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
