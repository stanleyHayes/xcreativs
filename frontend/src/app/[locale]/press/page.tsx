"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PressPage() {
  const [press, setPress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listPress().then((d) => { setPress(d.press || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Press & Newsroom</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Press releases, media coverage, and brand assets.
      </p>
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
  );
}
