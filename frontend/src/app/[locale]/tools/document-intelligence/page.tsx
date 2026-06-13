"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { FileSearch, ArrowRight, Loader2, Calendar, DollarSign, Building2, AlertCircle, FileText } from "lucide-react";

interface ExtractedResult {
  summary: string;
  entities: { type: string; value: string }[];
  dates: string[];
  obligations: string[];
  monetary_values: string[];
}

export default function DocumentIntelligencePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedResult | null>(null);
  const [error, setError] = useState("");

  async function handleExtract() {
    if (text.length < 50) {
      setError("Please paste at least 50 characters for meaningful extraction.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.extractDocument(text);
      setResult(res);
    } catch {
      setError("Extraction failed. Please try again with clearer text.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">§ 07 · Interactive Tool</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-pink-400" />
            Document Intelligence Demo
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            Paste contract text, policy documents, or tender extracts. Returns structured extraction: 
            entities, dates, monetary values, obligations, and a concise summary.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Document Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your document text here... Contracts, tender documents, policy briefs, or meeting minutes all work."
                className="w-full h-80 border border-hairline rounded-lg p-4 text-sm focus:outline-none focus:border-pink-400 resize-none bg-foundation"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gravity/40">{text.length} characters</span>
                <button
                  onClick={handleExtract}
                  disabled={loading || text.length < 50}
                  className="bg-signal text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? "Extracting..." : "Extract Intelligence"}
                </button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Results */}
            <div>
              {!result ? (
                <div className="h-full border border-hairline rounded-lg bg-foundation flex items-center justify-center p-8">
                  <div className="text-center">
                    <FileSearch className="w-10 h-10 text-gravity/20 mx-auto mb-3" />
                    <p className="text-sm text-gravity/40">Paste text and click Extract to see structured results.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="border border-hairline rounded-lg p-5 bg-foundation">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-pink-400" />
                      <h3 className="text-sm font-semibold">Summary</h3>
                    </div>
                    <p className="text-sm text-gravity/70 leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Dates */}
                  {result.dates.length > 0 && (
                    <div className="border border-hairline rounded-lg p-5 bg-foundation">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold">Dates ({result.dates.length})</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.dates.map((d, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-400/10 text-blue-400 text-xs rounded font-medium">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monetary values */}
                  {result.monetary_values.length > 0 && (
                    <div className="border border-hairline rounded-lg p-5 bg-foundation">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-semibold">Monetary Values ({result.monetary_values.length})</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.monetary_values.map((m, i) => (
                          <span key={i} className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded font-medium">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {result.entities.length > 0 && (
                    <div className="border border-hairline rounded-lg p-5 bg-foundation">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-sm font-semibold">Entities ({result.entities.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {result.entities.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-xs text-gravity/40 uppercase w-20 shrink-0">{e.type}</span>
                            <span className="text-gravity/70">{e.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Obligations */}
                  {result.obligations.length > 0 && (
                    <div className="border border-hairline rounded-lg p-5 bg-foundation">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <h3 className="text-sm font-semibold">Obligations ({result.obligations.length})</h3>
                      </div>
                      <ul className="space-y-2">
                        {result.obligations.map((o, i) => (
                          <li key={i} className="text-sm text-gravity/70 flex items-start gap-2">
                            <span className="text-red-400 mt-1 shrink-0">•</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
