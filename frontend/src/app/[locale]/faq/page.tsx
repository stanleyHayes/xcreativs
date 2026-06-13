"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listFAQ().then((d) => { setFaqs(d.faqs || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  const categories = Array.from(new Set(faqs.map((f) => f.Category)));

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">FAQ</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Real questions grouped by category. A working reference, not a marketing FAQ.
      </p>
      <div className="mt-12 space-y-12">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="text-xl font-semibold mb-6 border-b border-hairline pb-2">{cat}</h2>
            <div className="space-y-4">
              {faqs.filter((f) => f.Category === cat).map((f) => (
                <div key={f.ID} className="border border-hairline rounded p-6">
                  <p className="font-medium">{f.Question}</p>
                  <p className="mt-2 text-gravity/60">{f.Answer}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
