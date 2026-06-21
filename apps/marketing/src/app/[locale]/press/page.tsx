"use client";

import { useEffect, useState } from "react";
import { Megaphone, AlertTriangle } from "lucide-react";
import { api } from "@xc/api";
import PageBanner from "@xc/ui/PageBanner";
import EmptyState from "@xc/ui/EmptyState";

interface PressItem {
  Slug: string;
  Title: string;
  Body: string;
  IsCoverage?: boolean;
  PublishedAt?: string;
  SourceURL?: string;
}

export default function PressPage() {
  const [press, setPress] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listPress()
      .then((d) => {
        setPress(((d.press || []) as unknown as PressItem[]));
        setLoading(false);
      })
      .catch(() => setError("Failed to load data"));
  }, []);

  if (error)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load press releases"
        description="We couldn't load press releases right now. Please try again shortly."
      />
    );
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <PageBanner
        icon={Megaphone}
        eyebrow="Newsroom"
        title="Press & Newsroom"
        description="Press releases, media coverage, and brand assets."
        crumbs={[{ label: "Home", href: "/" }, { label: "Press & Newsroom" }]}
      />
      <main className="shell-x py-16">
      <div className="mt-12 space-y-8">
        {press.map((p) => (
          <article key={p.Slug} className="border-b border-hairline pb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2">
              {p.IsCoverage ? "Media Coverage" : "Press Release"}
              {p.PublishedAt && ` · ${new Date(p.PublishedAt).toLocaleDateString()}`}
            </p>
            <h2 className="text-xl font-semibold">{p.Title}</h2>
            <p className="mt-2 text-gravity/60 line-clamp-3">{p.Body}</p>
            {p.SourceURL && (
              <a href={p.SourceURL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-signal hover:underline">
                Read source →
              </a>
            )}
          </article>
        ))}
      </div>
      </main>
    </>
  );
}
