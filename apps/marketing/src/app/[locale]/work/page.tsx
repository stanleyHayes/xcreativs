import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";
import EmptyState from "@xc/ui/EmptyState";

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
      <main className="shell-x py-16">
        <div className="mt-12 grid gap-6 lg:grid-cols-12">
        {items.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No case studies yet"
            description="Case studies and work dossiers will appear here as engagements are published."
          />
        )}
        {items.map((item: WorkDossier, index: number) => (
          <Link
            key={item.Slug}
            href={`/work/${item.Slug}`}
            className="group card-x block p-8 lg:col-span-6 lg:[&:nth-child(3n+1)]:col-span-7 lg:[&:nth-child(3n+2)]:col-span-5"
          >
            <div className="grid gap-6 sm:grid-cols-[4rem_1fr]">
              <div>
                <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-signal">DOSSIER</span>
                <span className="mt-2 block font-display text-3xl font-semibold tabular-nums text-gravity/20">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="border-l border-hairline pl-5">
                <h2 className="text-xl font-semibold group-hover:text-signal transition-colors">
                  {item.Title}
                </h2>
                <p className="mt-1 text-sm text-gravity/60">
                  {item.ClientName} · {item.Industry} · {item.Stage}
                </p>
                <p className="mt-2 text-gravity/60">{item.Brief}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-signal"><FolderOpen className="h-3.5 w-3.5" />Open dossier</span>
              </div>
            </div>
          </Link>
        ))}
        </div>
      </main>
    </>
  );
}
