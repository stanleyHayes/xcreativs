"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@xc/api";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Library,
  Quote,
  Star,
  Tag,
} from "lucide-react";

interface ReadingListItem {
  Category?: string;
  Recommended?: boolean;
  Title?: string;
  Author?: string;
  SourcePublication?: string;
  PublishedYear?: string | number;
  ReadTimeMinutes?: number;
  Tags?: string[];
  SourceURL?: string;
  Annotation?: string;
  KeyTakeaway?: string;
}

const categoryLabels: Record<string, string> = {
  strategy: "Strategy",
  technology: "Technology",
  governance: "Governance",
  design: "Design",
  operations: "Operations",
  general: "General",
};

function categoryLabel(category?: string): string {
  if (!category) return "Reading list";
  return categoryLabels[category] || category;
}

export default function ReadingListDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [item, setItem] = useState<ReadingListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    api.getReadingListItem(slug)
      .then((d) => {
        if (!active) return;
        setItem(d as ReadingListItem);
      })
      .catch(() => {
        if (active) setItem(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const meta = useMemo(() => {
    if (!item) return [];
    return [
      item.Author ? { label: "Author", value: item.Author } : null,
      item.SourcePublication ? { label: "Source", value: item.SourcePublication } : null,
      item.PublishedYear ? { label: "Published", value: String(item.PublishedYear) } : null,
      item.ReadTimeMinutes ? { label: "Read time", value: `${item.ReadTimeMinutes} min` } : null,
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry));
  }, [item]);

  if (loading) {
    return (
      <main className="shell-x py-20">
        <div className="panel-x animate-pulse p-8 lg:p-12">
          <div className="h-4 w-28 rounded bg-gravity/10" />
          <div className="mt-8 h-12 w-full max-w-3xl rounded bg-gravity/10" />
          <div className="mt-4 h-5 w-full max-w-2xl rounded bg-gravity/10" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 rounded-lg bg-gravity/8" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="shell-x py-20">
        <div className="panel-x mx-auto max-w-2xl p-8 text-center lg:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-signal/20 bg-signal/8 text-signal">
            <Library className="h-5 w-5" />
          </span>
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">Reading list item not found</h1>
          <p className="mt-3 text-gravity/60">The item may have moved or is no longer published.</p>
          <Link href="/reading-list" className="btn-x mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to reading list
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell-x py-16 lg:py-20">
      <Link
        href="/reading-list"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal"
      >
        <ArrowLeft className="h-4 w-4" />
        Reading list
      </Link>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="panel-x overflow-hidden">
          <div className="relative bg-gravity px-6 py-10 text-foundation lg:px-10 lg:py-14">
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 py-1.5 text-sm font-semibold text-white/72">
                  <BookOpen className="h-3.5 w-3.5 text-signal" />
                  {categoryLabel(item.Category)}
                </span>
                {item.Recommended && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100">
                    <Star className="h-3.5 w-3.5 fill-yellow-200 text-yellow-200" />
                    Recommended
                  </span>
                )}
              </div>

              <h1 className="font-display mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white lg:text-6xl">
                {item.Title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/62 lg:text-lg">
                {item.KeyTakeaway || item.Annotation || "A curated source for teams building serious digital systems."}
              </p>

              {item.SourceURL && (
                <a
                  href={item.SourceURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-gravity transition-transform hover:-translate-y-0.5 hover:bg-signal hover:text-white"
                >
                  Read original source
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-8 p-6 lg:p-10">
            <section>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gravity/48">
                <Quote className="h-4 w-4 text-signal" />
                XCreativs annotation
              </div>
              <p className="whitespace-pre-line text-lg leading-relaxed text-gravity/78">
                {item.Annotation || "No annotation has been published for this item yet."}
              </p>
            </section>

            {item.KeyTakeaway && (
              <section className="rounded-lg border border-signal/18 bg-signal/7 p-5 lg:p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-signal">
                  <CheckCircle2 className="h-4 w-4" />
                  Key takeaway
                </div>
                <p className="text-xl font-medium leading-relaxed text-gravity">{item.KeyTakeaway}</p>
              </section>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card-x p-5">
            <p className="kicker-x text-signal">Source notes</p>
            <dl className="mt-4 space-y-3">
              {meta.map((entry) => (
                <div key={entry.label} className="flex items-start justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0">
                  <dt className="text-sm text-gravity/45">{entry.label}</dt>
                  <dd className="text-right text-sm font-semibold text-gravity">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {item.Tags && item.Tags.length > 0 && (
            <div className="card-x p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-gravity/50">
                <Tag className="h-3.5 w-3.5 text-signal" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {item.Tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-hairline bg-soft px-3 py-1 text-xs font-semibold text-gravity/62">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link href="/reading-list" className="card-x group flex items-center justify-between gap-4 p-5">
            <span>
              <span className="block text-sm font-semibold text-gravity">More reading</span>
              <span className="mt-1 block text-xs text-gravity/52">Return to the full curated library.</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-signal transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          {item.ReadTimeMinutes && (
            <div className="flex items-center gap-2 px-1 text-xs text-gravity/45">
              <Clock className="h-3.5 w-3.5 text-signal" />
              Designed for a {item.ReadTimeMinutes} minute review.
            </div>
          )}
        </aside>
      </article>
    </main>
  );
}
