"use client";

import { useEffect, useState } from "react";
import { BookText } from "lucide-react";
import { api } from "@xc/api";
import PageBanner from "@/components/PageBanner";

interface GlossaryTerm {
  ID: string;
  Term: string;
  Definition: string;
  RelatedTerms?: string[];
}

export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listGlossary().then((d) => { setTerms((d.terms as GlossaryTerm[] | undefined) || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <PageBanner
        icon={BookText}
        eyebrow="Reference"
        title="Glossary of Practice"
        description="Define the language the firm uses. Outsiders learn the language; insiders become loyal."
        crumbs={[{ label: "Home", href: "/" }, { label: "Glossary of Practice" }]}
      />
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {terms.map((t) => (
          <div key={t.ID} className="card-x p-6">
            <h2 className="text-lg font-semibold">{t.Term}</h2>
            <p className="mt-2 text-gravity/70 leading-relaxed">{t.Definition}</p>
            {t.RelatedTerms && t.RelatedTerms.length > 0 && (
              <p className="mt-3 text-xs text-gravity/40">
                Related: {t.RelatedTerms.join(", ")}
              </p>
            )}
          </div>
        ))}
        </div>
      </main>
    </>
  );
}
