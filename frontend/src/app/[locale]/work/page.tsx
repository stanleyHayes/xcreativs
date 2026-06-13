import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "Work — XCreativs Technologies",
  description:
    "Selected case dossiers from national-scale engagements. Each includes the problem, our approach, and measurable outcomes.",
};

interface WorkDossier {
  Slug: string;
  Title: string;
  ClientName: string;
  Industry: string;
  Stage: string;
  Brief: string;
}

async function getWork(): Promise<{ dossiers: WorkDossier[] }> {
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
    <>
      <PageBanner
        icon={FolderOpen}
        eyebrow="Selected engagements"
        title="Work"
        description="Selected case dossiers. Not a portfolio — a record of what happens when capability meets mandate."
        crumbs={[{ label: "Home", href: "/" }, { label: "Work" }]}
      />
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
        <div className="mt-12 space-y-8">
        {items.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No case studies available yet.</p>
        )}
        {items.map((item: WorkDossier) => (
          <Link
            key={item.Slug}
            href={`/work/${item.Slug}`}
            className="group card-x block p-8"
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
    </>
  );
}
