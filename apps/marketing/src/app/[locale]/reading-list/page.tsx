"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { BookOpen, ExternalLink, Star, Clock, Tag } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

const categoryLabels: Record<string, string> = {
  strategy: "Strategy",
  technology: "Technology",
  governance: "Governance",
  design: "Design",
  operations: "Operations",
  general: "General",
};

interface ReadingListItem {
  Slug: string;
  Title: string;
  Author: string;
  Category: string;
  Annotation: string;
  Recommended?: boolean;
  SourcePublication?: string;
  PublishedYear?: number;
  ReadTimeMinutes?: number;
  Tags?: string[];
  SourceURL?: string;
}

export default function ReadingListPage() {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    api.listReadingList(categoryFilter).then((d) => {
      setItems((d.items as ReadingListItem[] | undefined) || []);
      setLoading(false);
    });
  }, [categoryFilter]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;

  const categories = Array.from(new Set(items.map((i) => i.Category)));

  return (
    <>
      <PageBanner
        icon={BookOpen}
        eyebrow="Curated bibliography"
        title="Annotated Bibliography"
        description="Curated readings from the edges of digital systems, governance, and platform economics — annotated by the XCreativs team."
        crumbs={[{ label: "Home", href: "/" }, { label: "Annotated Bibliography" }]}
      />
      <main className="shell-x py-16">
        {/* Category filters */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("")}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            categoryFilter === "" ? "bg-signal text-white" : "bg-soft text-gravity/60 hover:bg-hairline"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
              categoryFilter === c ? "bg-signal text-white" : "bg-soft text-gravity/60 hover:bg-hairline"
            }`}
          >
            {categoryLabels[c] || c}
          </button>
        ))}
      </div>

      <div className="mt-12 space-y-8">
        {items.map((item) => (
          <Link
            key={item.Slug}
            href={`/reading-list/${item.Slug}`}
            className="group block border-b border-hairline pb-8 hover:border-signal transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-signal">
                    {categoryLabels[item.Category] || item.Category}
                  </span>
                  {item.Recommended && (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                      <Star className="w-3 h-3 fill-yellow-600" /> Recommended
                    </span>
                  )}
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold group-hover:text-signal transition-colors">
                  {item.Title}
                </h2>
                <p className="mt-1 text-sm text-gravity/60">
                  By {item.Author}
                  {item.SourcePublication && ` · ${item.SourcePublication}`}
                  {item.PublishedYear && ` · ${item.PublishedYear}`}
                </p>
                <p className="mt-3 text-gravity/70 line-clamp-3">{item.Annotation}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gravity/40">
                  {item.ReadTimeMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.ReadTimeMinutes} min read
                    </span>
                  )}
                  {item.Tags && item.Tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {item.Tags.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              {item.SourceURL && (
                <span className="inline-flex items-center gap-1 text-xs text-signal shrink-0">
                  <ExternalLink className="w-3 h-3" /> Source
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gravity/40 py-12">No reading list items found.</p>
      )}
      </main>
    </>
  );
}
