"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function GlossaryPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listGlossary().then((d) => { setTerms(d.terms || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Glossary of Practice</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Define the language the firm uses. Outsiders learn the language; insiders become loyal.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {terms.map((t) => (
          <div key={t.ID} className="border border-hairline rounded p-6">
            <h2 className="text-lg font-semibold">{t.Term}</h2>
            <p className="mt-2 text-gravity/70 leading-relaxed">{t.Definition}</p>
            {t.RelatedTerms?.length > 0 && (
              <p className="mt-3 text-xs text-gravity/40">
                Related: {t.RelatedTerms.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
