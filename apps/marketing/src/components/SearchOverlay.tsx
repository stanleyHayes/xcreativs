"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SearchResultItem, SearchResponse } from "@/lib/types";
import { Search, X, FileText, Briefcase, BookOpen, Globe, AlertTriangle, CheckSquare, MessageSquare, Loader2 } from "lucide-react";

type SearchResult = SearchResultItem;

interface PortalSearchResponse {
  public?: SearchResult[];
  portal?: SearchResult[];
}

const typeIcons: Record<string, React.ReactNode> = {
  insight: <BookOpen className="w-4 h-4" />,
  case_dossier: <Briefcase className="w-4 h-4" />,
  service: <Globe className="w-4 h-4" />,
  deliverable: <FileText className="w-4 h-4" />,
  decision: <CheckSquare className="w-4 h-4" />,
  risk: <AlertTriangle className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  insight: "Insight",
  case_dossier: "Case Dossier",
  service: "Service",
  deliverable: "Deliverable",
  decision: "Decision",
  risk: "Risk",
  comment: "Comment",
};

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ public: SearchResult[]; portal: SearchResult[] }>({ public: [], portal: [] });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated] = useState(() =>
    typeof window !== "undefined" && !!localStorage.getItem("access_token")
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(() => setResults({ public: [], portal: [] }), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setLoading(true);
      if (isAuthenticated) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/portal/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        })
          .then((r) => r.json() as Promise<PortalSearchResponse>)
          .then((d) => { setResults({ public: d.public || [], portal: d.portal || [] }); setLoading(false); })
          .catch(() => setLoading(false));
      } else {
        api.search(query)
          .then((d: SearchResponse) => { setResults({ public: d.results || [], portal: [] }); setLoading(false); })
          .catch(() => setLoading(false));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isAuthenticated]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  const allResults = [...results.public, ...results.portal];
  const grouped = allResults.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-foundation border border-hairline rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <Search className="w-5 h-5 text-gravity/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAuthenticated ? "Search portal content, deliverables, decisions..." : "Search services, insights, case dossiers..."}
            className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-gravity/30"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gravity/30" />}
          <button onClick={onClose} className="p-1 text-gravity/30 hover:text-gravity transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {allResults.length === 0 && query.trim() && !loading && (
            <div className="px-4 py-8 text-center text-gravity/40 text-sm">No results found for &quot;{query}&quot;</div>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-4 py-2 bg-soft text-xs font-medium uppercase tracking-wider text-gravity/40">
                {typeLabels[type] || type} ({items.length})
              </div>
              {items.map((r) => {
                const href = r.type === "insight" ? `/insights/${r.slug}` : r.type === "case_dossier" ? `/work/${r.slug}` : r.type === "service" ? `/services/${r.slug}` : `#`;
                const linkClassName = "flex items-start gap-3 px-4 py-3 hover:bg-soft transition-colors border-b border-hairline/50 last:border-0";
                const linkContent = (
                  <>
                    <span className="text-signal mt-0.5">{typeIcons[type] || <FileText className="w-4 h-4" />}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-gravity/50 line-clamp-2">{r.excerpt}</p>
                    </div>
                  </>
                );
                if (href === "#") {
                  return (
                    <a key={r.slug + r.type} href={href} className={linkClassName}>
                      {linkContent}
                    </a>
                  );
                }
                return (
                  <Link key={r.slug + r.type} href={href} className={linkClassName}>
                    {linkContent}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-hairline bg-soft text-[10px] text-gravity/30 flex items-center justify-between">
          <span>{isAuthenticated ? "Searching public + portal content" : "Searching public content only"}</span>
          <span className="flex items-center gap-1"><kbd className="px-1 bg-foundation border border-hairline rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
