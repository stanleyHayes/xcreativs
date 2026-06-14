"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Building2, Network } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

type LeadershipMember = string | { name?: string; role?: string };

type Subsidiary = {
  ID?: string | number;
  Slug?: string;
  Name?: string;
  Status?: string;
  RelationshipToParent?: string;
  Description?: string;
  Leadership?: LeadershipMember[];
};

export default function SubsidiariesPage() {
  const [subs, setSubs] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listSubsidiaries()
      .then((d) => { setSubs(d.subsidiaries || []); setLoading(false); })
      .catch(() => setError("Failed to load data"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <PageBanner
        icon={Network}
        eyebrow="Group companies"
        title="Subsidiaries"
        description="The companies under the XCreativs holding structure. Each is operationally distinct, with its own leadership, but shares the firm's standards for security, sovereignty, and engineering rigour."
        crumbs={[{ label: "Home", href: "/" }, { label: "Subsidiaries" }]}
      />
      <main className="shell-x py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subs.map((s) => (
          <div key={s.ID || s.Slug} className="card-x p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-signal/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-signal" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{s.Name}</h2>
                  {s.Status && (
                    <span className="text-xs px-2 py-0.5 rounded bg-soft text-gravity/50 capitalize">{s.Status}</span>
                  )}
                </div>
                {s.RelationshipToParent && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-signal">
                    <Network className="w-3 h-3" /> {s.RelationshipToParent}
                  </p>
                )}
                <p className="mt-3 text-gravity/70 leading-relaxed">{s.Description}</p>
                {Array.isArray(s.Leadership) && s.Leadership.length > 0 && (
                  <div className="mt-4 border-t border-hairline pt-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-1">Leadership</p>
                    <ul className="space-y-0.5 text-sm text-gravity/60">
                      {s.Leadership.map((l: LeadershipMember, i: number) => (
                        <li key={i}>
                          {typeof l === "string"
                            ? l
                            : [l?.name, l?.role].filter(Boolean).join(" — ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {subs.length === 0 && (
        <p className="text-center text-gravity/40 py-12">No subsidiaries listed.</p>
      )}
      </main>
    </>
  );
}
