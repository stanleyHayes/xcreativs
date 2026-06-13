"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowLeft, Lock, Download } from "lucide-react";

export default function InsightDetailPage() {
  const { slug } = useParams();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.getInsight(slug as string).then((d) => { setInsight(d); setLoading(false); });
  }, [slug]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setRequesting(true);
    setError(null);
    try {
      const res = await api.downloadInsight(slug as string, { email, first_name: firstName });
      setDownloadUrl(res.download_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate your download. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!insight) return <div className="p-12 text-center">Insight not found</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/insights" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Insights
      </Link>
      <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2">
        {insight.ContentType}
      </p>
      <h1 className="text-3xl lg:text-5xl font-bold max-w-4xl">{insight.Title}</h1>
      <p className="mt-4 text-gravity/60">
        By {insight.AuthorName}{insight.AuthorTitle ? `, ${insight.AuthorTitle}` : ""}
        {insight.PublishedAt ? ` · ${new Date(insight.PublishedAt).toLocaleDateString()}` : ""}
      </p>

      {insight.IsGated ? (
        <div className="mt-12 border border-hairline rounded p-12 text-center bg-soft">
          {downloadUrl ? (
            <>
              <Download className="w-8 h-8 text-signal mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Your download is ready</h2>
              <p className="mt-2 text-gravity/60 max-w-md mx-auto">
                Thank you. A copy has been linked to your email.
              </p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-signal text-white px-6 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" /> Download {insight.ContentType}
              </a>
            </>
          ) : (
            <>
              <Lock className="w-8 h-8 text-signal mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Gated Content</h2>
              <p className="mt-2 text-gravity/60 max-w-md mx-auto">
                This {insight.ContentType} is available as a qualified download. Enter your details to receive access.
              </p>
              <form className="mt-6 max-w-sm mx-auto space-y-2" onSubmit={handleRequest}>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name (optional)"
                  className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
                />
                <div className="flex gap-2">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
                  />
                  <button
                    type="submit"
                    disabled={requesting}
                    className="bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                  >
                    {requesting ? "..." : "Request Access"}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </form>
            </>
          )}
        </div>
      ) : (
        <article className="mt-12 max-w-3xl prose prose-lg text-gravity/80">
          <p className="whitespace-pre-line leading-relaxed">{insight.Body}</p>
        </article>
      )}
    </main>
  );
}
