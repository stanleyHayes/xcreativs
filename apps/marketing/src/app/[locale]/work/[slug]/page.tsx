"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { Entity } from "@xc/api/types";
import { ArrowLeft, ArrowRight, FileText, Layers, TrendingUp } from "lucide-react";

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
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_75%_10%,black,transparent_70%)]" />
        <div className="shell-x relative py-16 lg:py-24">
          <Link href="/work" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" /> All Dossiers
          </Link>
          <p className="kicker-x text-signal">
            {dossier.Industry} · {dossier.ServiceLine} · {dossier.Scale}
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
            {dossier.Title}
          </h1>
          {dossier.ClientName && !dossier.Anonymized && (
            <p className="mt-4 text-gravity/60">Client: {dossier.ClientName}</p>
          )}
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-3 lg:py-20">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Brief" content={dossier.Brief} icon={FileText} />
            {dossier.ConstraintSet && <Section title="Constraint Set" content={dossier.ConstraintSet} icon={Layers} />}
            {dossier.ArchitectureChosen && <Section title="Architecture Chosen" content={dossier.ArchitectureChosen} icon={Layers} />}
            <Section title="What Shipped" content={dossier.WhatShipped} icon={TrendingUp} />
            {dossier.IPRetained && <Section title="IP Retained" content={dossier.IPRetained} icon={FileText} />}
            {dossier.Learnings && <Section title="Learnings" content={dossier.Learnings} icon={TrendingUp} />}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="panel-x p-6">
              <p className="kicker-x">Stage</p>
              <p className="mt-2 text-2xl font-semibold capitalize">{dossier.Stage}</p>
            </div>
            <div className="panel-x p-6">
              <p className="kicker-x">Scale</p>
              <p className="mt-2 text-2xl font-semibold capitalize">{dossier.Scale}</p>
            </div>
            <Link href="/contact" className="btn-x w-full">
              Discuss a Similar Engagement <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Section({ title, content, icon: Icon }: { title: string; content: string; icon: React.ElementType }) {
  return (
    <section className="panel-x p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-hairline bg-foundation text-signal">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="prose-x mt-5 whitespace-pre-line">{content}</p>
    </section>
  );
}
