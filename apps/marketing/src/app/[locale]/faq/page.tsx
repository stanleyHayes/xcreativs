"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { api } from "@xc/api";
import type { Entity } from "@xc/api/types";
import PageBanner from "@xc/ui/PageBanner";

interface FAQItem extends Entity {
  ID: string;
  Category: string;
  Question: string;
  Answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listFAQ().then((d) => { setFaqs((d.faqs as FAQItem[]) || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  const categories = Array.from(new Set(faqs.map((f) => f.Category)));

  return (
    <>
      <PageBanner
        icon={HelpCircle}
        eyebrow="Questions"
        title="FAQ"
        description="Real questions grouped by category. A working reference, not a marketing FAQ."
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
        <div className="mt-12 space-y-12">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="text-xl font-semibold mb-6 border-b border-hairline pb-2">{cat}</h2>
              <div className="space-y-4">
                {faqs.filter((f) => f.Category === cat).map((f) => (
                  <div key={f.ID} className="card-x p-6">
                    <p className="font-medium">{f.Question}</p>
                    <p className="mt-2 text-gravity/60">{f.Answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
