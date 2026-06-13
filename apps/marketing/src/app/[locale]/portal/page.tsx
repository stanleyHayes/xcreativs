"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Briefcase, ArrowRight } from "lucide-react";

interface Engagement {
  ID: string;
  Sector?: string;
  ServiceLine?: string;
  Title?: string;
  ClientName?: string;
  Stage?: string;
  CurrencyPreference?: string;
}

interface PortalHome {
  engagements?: Engagement[];
}

export default function PortalHomePage() {
  const [data, setData] = useState<PortalHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    api
      .getPortalHome()
      .then((d) => { setData(d as PortalHome); setLoading(false); })
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="p-8 text-white/60">Failed to load portal data.</div>;
  if (loading) return <div className="p-8 text-white/60">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Portal Overview</h1>
      <p className="mt-2 text-white/60">
        Welcome back. Here are your active engagements.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.engagements?.map((eng) => (
          <Link
            key={eng.ID}
            href={`/${locale}/portal/engagements/${eng.ID}/dashboard`}
            className="group border border-white/10 rounded-lg p-6 hover:border-signal transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2">
                  {eng.Sector} · {eng.ServiceLine}
                </p>
                <h2 className="text-lg font-semibold group-hover:text-signal transition-colors">
                  {eng.Title}
                </h2>
                <p className="mt-1 text-sm text-white/50">{eng.ClientName}</p>
              </div>
              <Briefcase className="w-5 h-5 text-white/20 group-hover:text-signal transition-colors" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/40">
              <span className="capitalize">{eng.Stage}</span>
              <span>·</span>
              <span>{eng.CurrencyPreference}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-signal opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
