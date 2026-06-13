"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { Entity } from "@xc/api/types";
import { ArrowLeft } from "lucide-react";

interface Dossier {
  Industry?: string;
  ServiceLine?: string;
  Scale?: string;
  Title?: string;
  ClientName?: string;
  Anonymized?: boolean;
  Brief: string;
  ConstraintSet?: string;
  ArchitectureChosen?: string;
  WhatShipped: string;
  IPRetained?: string;
  Learnings?: string;
  Stage?: string;
}

export default function WorkDetailPage() {
  const { slug } = useParams();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getWork(slug as string).then((d: Entity) => { setDossier(d as unknown as Dossier); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!dossier) return <div className="p-12 text-center">Dossier not found</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/work" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Dossiers
      </Link>
      <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2">
        {dossier.Industry} · {dossier.ServiceLine} · {dossier.Scale}
      </p>
      <h1 className="text-3xl lg:text-5xl font-bold">{dossier.Title}</h1>
      {dossier.ClientName && !dossier.Anonymized && (
        <p className="mt-2 text-gravity/60">Client: {dossier.ClientName}</p>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <Section title="Brief" content={dossier.Brief} />
          {dossier.ConstraintSet && <Section title="Constraint Set" content={dossier.ConstraintSet} />}
          {dossier.ArchitectureChosen && <Section title="Architecture Chosen" content={dossier.ArchitectureChosen} />}
          <Section title="What Shipped" content={dossier.WhatShipped} />
          {dossier.IPRetained && <Section title="IP Retained" content={dossier.IPRetained} />}
          {dossier.Learnings && <Section title="Learnings" content={dossier.Learnings} />}
        </div>
        <aside className="space-y-6">
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Stage</p>
            <p className="mt-1 text-lg font-semibold capitalize">{dossier.Stage}</p>
          </div>
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Scale</p>
            <p className="mt-1 text-lg font-semibold capitalize">{dossier.Scale}</p>
          </div>
          <Link
            href="/contact"
            className="block text-center bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Discuss a Similar Engagement
          </Link>
        </aside>
      </div>
    </main>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <p className="text-gravity/70 leading-relaxed whitespace-pre-line">{content}</p>
    </section>
  );
}
