"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, Star, Clock, Tag } from "lucide-react";

const categoryLabels: Record<string, string> = {
  strategy: "Strategy",
  technology: "Technology",
  governance: "Governance",
  design: "Design",
  operations: "Operations",
  general: "General",
};

export default function ReadingListDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getReadingListItem(slug)
      .then((d) => { setItem(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!item) return <div className="p-12 text-center">Reading list item not found.</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/reading-list" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Reading List
      </Link>

      <article className="max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-signal">
            {categoryLabels[item.Category] || item.Category}
          </span>
          {item.Recommended && (
            <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
              <Star className="w-3 h-3 fill-yellow-600" /> Recommended
            </span>
          )}
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold">{item.Title}</h1>
        <p className="mt-2 text-lg text-gravity/60">
          By {item.Author}
          {item.SourcePublication && ` · ${item.SourcePublication}`}
          {item.PublishedYear && ` · ${item.PublishedYear}`}
        </p>

        <div className="mt-4 flex items-center gap-4 text-sm text-gravity/40">
          {item.ReadTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {item.ReadTimeMinutes} min read
            </span>
          )}
          {item.Tags?.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" /> {item.Tags.join(", ")}
            </span>
          )}
        </div>

        {item.SourceURL && (
          <a
            href={item.SourceURL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-signal text-white text-sm font-medium rounded hover:bg-signal/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Read Original Source
          </a>
        )}

        <div className="mt-12 space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-3">XCreativs Annotation</h2>
            <p className="text-lg leading-relaxed text-gravity/80 whitespace-pre-line">{item.Annotation}</p>
          </section>

          {item.KeyTakeaway && (
            <section className="bg-soft border border-hairline rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-signal mb-3">Key Takeaway</h2>
              <p className="text-lg font-medium text-gravity leading-relaxed">{item.KeyTakeaway}</p>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
