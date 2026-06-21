"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { ArrowRight, BriefcaseBusiness, Building2, Filter, Search, SlidersHorizontal, Target, Users } from "lucide-react";

interface Engagement {
  ID?: string;
  Title?: string;
  Sector?: string;
  ServiceLine?: string;
  ClientName?: string;
  Stage?: string;
  CurrencyPreference?: string;
}

function formatStage(stage?: string) {
  if (!stage) return "Unstaged";
  return stage.replace(/[_-]/g, " ");
}

function stageTone(stage?: string) {
  const normalized = String(stage || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("launch")) return "text-green-300 bg-green-400/10 border-green-400/20";
  if (normalized.includes("risk") || normalized.includes("hold")) return "text-red-300 bg-red-400/10 border-red-400/20";
  if (normalized.includes("build") || normalized.includes("progress")) return "text-signal bg-signal/10 border-signal/20";
  return "text-yellow-200 bg-yellow-400/10 border-yellow-400/20";
}

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    api.listEngagements().then((d) => { setEngagements((d.engagements as Engagement[] | undefined) || []); setLoading(false); }).catch(() => { setError("Failed to load engagements"); setLoading(false); });
  }, []);

  if (error) {
    return (
      <div className="portal-panel-x p-8">
        <p className="portal-meta-x">Client work</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">Engagements unavailable</h1>
        <p className="mt-3 text-sm text-white/56">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-40" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
        <div className="portal-skeleton-x h-72" />
      </div>
    );
  }

  const stages = Array.from(new Set(engagements.map((eng) => formatStage(eng.Stage)))).sort();
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEngagements = engagements.filter((eng) => {
    const matchesQuery = !normalizedQuery
      || [eng.Title, eng.ClientName, eng.Sector, eng.ServiceLine, eng.Stage]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesStage = stageFilter === "all" || formatStage(eng.Stage) === stageFilter;
    return matchesQuery && matchesStage;
  });

  const clientCount = new Set(engagements.map((eng) => eng.ClientName).filter(Boolean)).size;
  const sectorCount = new Set(engagements.map((eng) => eng.Sector).filter(Boolean)).size;
  const activeCount = engagements.filter((eng) => !String(eng.Stage || "").toLowerCase().includes("complete")).length;

  const metrics = [
    { label: "Total rooms", value: engagements.length, icon: BriefcaseBusiness },
    { label: "Active work", value: activeCount, icon: Target },
    { label: "Clients", value: clientCount, icon: Users },
    { label: "Sectors", value: sectorCount, icon: Building2 },
  ];

  return (
    <div className="space-y-7">
      <section className="portal-panel-x p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="portal-meta-x">Client work</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-none">Engagements</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58">
              Workspaces for active delivery, governance, finance, support, approvals, and partner collaboration.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[32rem]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="portal-field-x portal-field-icon-x"
                placeholder="Search workspaces"
              />
            </label>
            <label className="relative block">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <CustomSelect
                value={stageFilter}
                onChange={setStageFilter}
                options={[
                  { value: "all", label: "All stages" },
                  ...stages.map((stage) => ({ value: stage, label: stage })),
                ]}
                variant="portal"
                triggerClassName="portal-field-icon-x"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="portal-card-x portal-stat-x p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="portal-meta-x">{metric.label}</p>
                <Icon className="h-5 w-5 text-signal" />
              </div>
              <p className="font-display text-4xl font-semibold">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="portal-panel-x p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="portal-meta-x">Directory</p>
            <h2 className="font-display mt-2 text-2xl font-semibold">{filteredEngagements.length} visible workspaces</h2>
          </div>
          <div className="portal-chip-x">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {stageFilter === "all" ? "All stages" : stageFilter}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredEngagements.length === 0 && (
            <div className="portal-card-x col-span-full p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-white/24" />
              <h3 className="font-display mt-3 text-xl font-semibold">No matching engagements</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/48">
                Adjust the search or stage filter to bring workspaces back into view.
              </p>
            </div>
          )}

          {filteredEngagements.map((eng) => (
            <Link
              key={eng.ID || `${eng.Title}-${eng.ClientName}`}
              href={eng.ID ? `/${locale}/portal/engagements/${eng.ID}/dashboard` : `/${locale}/portal/engagements`}
              className="portal-card-x group p-5 transition-colors hover:border-signal/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="portal-meta-x text-signal">
                    {[eng.Sector, eng.ServiceLine].filter(Boolean).join(" · ") || "Engagement"}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-semibold transition-colors group-hover:text-signal">
                    {eng.Title || "Untitled engagement"}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">{eng.ClientName || "Client workspace"}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/20 transition-colors group-hover:text-signal" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`portal-chip-x border capitalize ${stageTone(eng.Stage)}`}>{formatStage(eng.Stage)}</span>
                {eng.CurrencyPreference && <span className="portal-chip-x">{eng.CurrencyPreference}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
