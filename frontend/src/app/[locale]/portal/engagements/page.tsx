"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Briefcase, ArrowRight } from "lucide-react";

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    api.listEngagements().then((d) => { setEngagements(d.engagements || []); setLoading(false); }).catch(() => setError("Failed to load engagements"));
  }, []);

  if (error) return <div className="p-8 text-white/60">{error}</div>;
  if (loading) return <div className="p-8 text-white/60">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Your Engagements</h1>
      <div className="mt-6 space-y-4">
        {engagements.map((eng) => (
          <Link
            key={eng.ID}
            href={`/${locale}/portal/engagements/${eng.ID}/dashboard`}
            className="flex items-center justify-between border border-white/10 rounded-lg p-6 hover:border-signal transition-colors group"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-signal mb-1">
                {eng.Sector} · {eng.ServiceLine}
              </p>
              <h2 className="text-lg font-semibold group-hover:text-signal transition-colors">
                {eng.Title}
              </h2>
              <p className="text-sm text-white/50">{eng.ClientName}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-signal transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
