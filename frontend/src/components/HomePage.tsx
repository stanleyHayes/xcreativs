"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowRight, ArrowUpRight, Briefcase, FlaskConical, BookOpen, Building2, Landmark, Network } from "lucide-react";
import LiveEngagementCounter from "./LiveEngagementCounter";
import HeroBackdrop from "./decor/HeroBackdrop";
import type { HoldingTreeResponse } from "@/lib/types";

interface ServiceItem {
  Slug: string;
  Title: string;
  Summary: string;
}

interface LabItem {
  Slug: string;
  Name: string;
  Tagline: string;
  ProblemStatement: string;
}

interface DossierItem {
  Slug: string;
  Industry: string;
  ServiceLine: string;
  Title: string;
  Brief: string;
}

interface HomeData {
  services?: ServiceItem[];
  labs?: LabItem[];
  dossiers?: DossierItem[];
}

interface HoldingItem {
  Title?: string;
  Name?: string;
  Slug?: string;
}

interface HoldingDivision {
  name: string;
  items?: HoldingItem[];
}

interface TickerData {
  ActiveEngagements?: number;
  SectorsCovered?: number;
  CapabilitiesDeployed?: number;
  TotalDeliverables?: number;
}

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getHome()
      .then((d) => setData(d as HomeData))
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="p-12 text-center">{tc("error")}</div>;
  if (!data) return <div className="p-12 text-center">{tc("loading")}</div>;

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-hairline">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-[1440px] px-6 lg:px-12 py-28 lg:py-44">
          <div
            className="animate-rise inline-flex items-center gap-2 rounded-full border border-hairline bg-foundation/60 px-3.5 py-1.5 text-xs font-medium text-gravity/70 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            Sovereign-by-design · National-scale systems
          </div>
          <h1
            className="animate-rise font-display mt-6 max-w-4xl text-[2.7rem] font-semibold leading-[1.02] tracking-tight lg:text-7xl"
            style={{ animationDelay: "0.08s" }}
          >
            {t("hero")}
          </h1>
          <p
            className="animate-rise mt-7 max-w-2xl text-lg leading-relaxed text-gravity/65 lg:text-xl"
            style={{ animationDelay: "0.16s" }}
          >
            {t("hero_sub")}
          </p>
          <div
            className="animate-rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.24s" }}
          >
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-signal/25 transition-transform hover:-translate-y-0.5"
            >
              {t("cta_work")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-gravity/20 px-6 py-3.5 text-sm font-semibold text-gravity transition-colors hover:border-gravity hover:bg-gravity hover:text-foundation"
            >
              {t("cta_engage")}
            </Link>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Holding-company tree */}
      <HoldingTree />

      {/* Services Snapshot */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">
            § 01
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-10">{t("services_title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.services?.map((s) => (
              <Link
                key={s.Slug}
                href={`/services/${s.Slug}`}
                className="group card-x p-6"
              >
                <Briefcase className="w-5 h-5 text-signal mb-4" />
                <h3 className="text-lg font-semibold group-hover:text-signal transition-colors">
                  {s.Title}
                </h3>
                <p className="mt-2 text-sm text-gravity/60 line-clamp-3">
                  {s.Summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Labs Preview */}
      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">
            § 02
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">{t("labs_title")}</h2>
          <p className="text-gravity/60 mb-10 max-w-xl">{t("labs_sub")}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.labs?.map((p) => (
              <Link
                key={p.Slug}
                href={`/labs/${p.Slug}`}
                className="group card-x p-8"
              >
                <FlaskConical className="w-5 h-5 text-signal mb-4" />
                <h3 className="text-xl font-semibold group-hover:text-signal transition-colors">
                  {p.Name}
                </h3>
                <p className="mt-2 text-gravity/70">{p.Tagline}</p>
                <p className="mt-4 text-sm text-gravity/60 line-clamp-3">
                  {p.ProblemStatement}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Dossiers */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">
            § 03
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-10">{t("dossiers_title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.dossiers?.slice(0, 5).map((d) => (
              <Link
                key={d.Slug}
                href={`/work/${d.Slug}`}
                className="group card-x overflow-hidden"
              >
                <div className="bg-soft h-40 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gravity/20" />
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2">
                    {d.Industry} · {d.ServiceLine}
                  </p>
                  <h3 className="text-lg font-semibold group-hover:text-signal transition-colors line-clamp-2">
                    {d.Title}
                  </h3>
                  <p className="mt-2 text-sm text-gravity/60 line-clamp-3">
                    {d.Brief}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 lg:py-32">
          <p className="text-2xl lg:text-4xl font-medium leading-snug max-w-4xl">
            {t("manifesto")}
          </p>
        </div>
      </section>

      <LiveEngagementCounter />

      {/* Engage CTA */}
      <section className="border-b border-hairline bg-gravity text-foundation">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 lg:py-32">
          <h2 className="text-2xl lg:text-4xl font-bold">{t("engage_title")}</h2>
          <p className="mt-4 text-foundation/70 max-w-xl">
            Serious prospects only. Begin with the engagement readiness diagnostic.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Diagnostic
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function HoldingTree() {
  const [tree, setTree] = useState<HoldingTreeResponse | null>(null);

  useEffect(() => {
    api.getHoldingTree().then((d) => setTree(d)).catch(() => {});
  }, []);

  if (!tree?.children) return null;

  const meta: Record<string, { href: string; icon: React.ReactNode; blurb: string }> = {
    Services: { href: "/services", icon: <Briefcase className="w-5 h-5" />, blurb: "Client engagements" },
    Labs: { href: "/labs", icon: <FlaskConical className="w-5 h-5" />, blurb: "Product arm" },
    Subsidiaries: { href: "/subsidiaries", icon: <Landmark className="w-5 h-5" />, blurb: "Spun-out companies" },
  };
  const itemName = (it: HoldingItem) => it?.Title || it?.Name || it?.Slug || "";
  const divisions = tree.children as unknown as HoldingDivision[];

  return (
    <section className="border-b border-hairline bg-soft">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
        <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">§ 00 · Structure</p>
        <h2 className="text-2xl lg:text-3xl font-bold mb-3">Holding company</h2>
        <p className="text-gravity/60 mb-10 max-w-xl">
          One holding company, three arms. Client revenue funds the Labs that build products, which spin out into
          independent subsidiaries.
        </p>

        <div className="inline-flex items-center gap-3 border border-hairline rounded-lg px-5 py-3 bg-foundation mb-6">
          <div className="p-2 bg-gravity text-foundation rounded">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">{tree.parent?.name || "XCreativs Technologies"}</p>
            <p className="text-xs text-gravity/50">Holding company</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {divisions.map((div) => {
            const m = meta[div.name] || { href: "#", icon: <Network className="w-5 h-5" />, blurb: "" };
            const items: HoldingItem[] = div.items || [];
            return (
              <Link
                key={div.name}
                href={m.href}
                className="group card-x p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-signal">
                    {m.icon}
                    <span className="font-semibold text-gravity">{div.name}</span>
                  </div>
                  <span className="text-xs text-gravity/40">{items.length}</span>
                </div>
                <p className="text-xs text-gravity/50 mb-3">{m.blurb}</p>
                <ul className="space-y-1">
                  {items.slice(0, 4).map((it, i) => (
                    <li key={i} className="text-sm text-gravity/70 line-clamp-1">
                      {itemName(it)}
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-sm text-gravity/30">—</li>}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-signal opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/tools/holding-visualiser"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-signal hover:underline"
        >
          Explore the holding-company visualiser <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function LiveTicker() {
  const tt = useTranslations("ticker");
  const [ticker, setTicker] = useState<TickerData | null>(null);

  useEffect(() => {
    api.getTicker().then((d) => setTicker(d as TickerData));
    const interval = setInterval(() => {
      api.getTicker().then((d) => setTicker(d as TickerData));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!ticker) return null;

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl lg:text-4xl font-bold text-signal">
              {ticker.ActiveEngagements}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gravity/40">
              {tt("active_engagements")}
            </p>
          </div>
          <div>
            <p className="text-3xl lg:text-4xl font-bold text-signal">
              {ticker.SectorsCovered}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gravity/40">
              {tt("sectors_covered")}
            </p>
          </div>
          <div>
            <p className="text-3xl lg:text-4xl font-bold text-signal">
              {ticker.CapabilitiesDeployed}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gravity/40">
              {tt("capabilities_deployed")}
            </p>
          </div>
          <div>
            <p className="text-3xl lg:text-4xl font-bold text-signal">
              {ticker.TotalDeliverables}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gravity/40">
              {tt("deliverables_in_flight")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
