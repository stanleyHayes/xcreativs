"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@xc/api";

// Placeholder imagery — swap the files in /public/media to replace site-wide.
const MEDIA = [
  "/media/hero-network-1.png",
  "/media/ai-systems-1.png",
  "/media/hero-network-2.png",
  "/media/ai-systems-2.png",
];
import { ArrowRight, ArrowUpRight, Briefcase, FlaskConical, Building2, Landmark, Network } from "lucide-react";
import LiveEngagementCounter from "./LiveEngagementCounter";
import HeroBackdrop from "./decor/HeroBackdrop";
import type { HoldingTreeResponse } from "@xc/api/types";

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
            {data.dossiers?.slice(0, 5).map((d, i) => (
              <Link
                key={d.Slug}
                href={`/work/${d.Slug}`}
                className="group card-x overflow-hidden"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={MEDIA[i % MEDIA.length]}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foundation via-foundation/10 to-transparent" />
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
      <section className="relative overflow-hidden border-b border-hairline bg-foundation text-gravity dark:border-white/10 dark:bg-[#08090d] dark:text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(0,102,204,0.12),transparent_30rem)] dark:bg-[radial-gradient(circle_at_82%_18%,rgba(91,147,255,0.22),transparent_30rem)]"
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-12 lg:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-signal">Qualified access</p>
          <h2 className="font-display max-w-3xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">{t("engage_title")}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gravity/62 dark:text-white/65 lg:text-lg">
            Serious prospects only. Begin with the engagement readiness diagnostic.
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gravity px-5 py-3 text-sm font-semibold text-foundation shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 hover:bg-signal hover:text-white dark:bg-white dark:text-[#08090d] dark:hover:bg-[#5b93ff] dark:hover:text-white"
          >
            Start Diagnostic
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

  const meta: Record<
    string,
    {
      href: string;
      icon: React.ReactNode;
      eyebrow: string;
      blurb: string;
      mandate: string;
    }
  > = {
    Services: {
      href: "/services",
      icon: <Briefcase className="h-5 w-5" />,
      eyebrow: "Revenue engine",
      blurb: "Client engagements that fund delivery capacity and frontier experiments.",
      mandate: "Audit, architect, automate, and ship platforms with senior operator oversight.",
    },
    Labs: {
      href: "/labs",
      icon: <FlaskConical className="h-5 w-5" />,
      eyebrow: "Product studio",
      blurb: "Reusable products formed from repeated client patterns and infrastructure gaps.",
      mandate: "Prototype, validate, and harden internal IP before it becomes a company.",
    },
    Subsidiaries: {
      href: "/subsidiaries",
      icon: <Landmark className="h-5 w-5" />,
      eyebrow: "Spin-out layer",
      blurb: "Independent companies built to operate mature products with dedicated governance.",
      mandate: "Give proven systems their own team, balance sheet, and long-term mandate.",
    },
  };

  const itemName = (it: HoldingItem) => it?.Title || it?.Name || it?.Slug || "";
  const divisionOrder = ["Services", "Labs", "Subsidiaries"];
  const divisions = [...(tree.children as unknown as HoldingDivision[])].sort((a, b) => {
    const aIndex = divisionOrder.indexOf(a.name);
    const bIndex = divisionOrder.indexOf(b.name);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
  const parentName = tree.parent?.name || "XCreativs Technologies";
  const totalUnits = divisions.reduce((sum, div) => sum + (div.items?.length || 0), 0);
  const flow = [
    {
      label: "01",
      title: "Client revenue",
      text: "Services generate the cash flow and field evidence.",
    },
    {
      label: "02",
      title: "Labs IP",
      text: "Repeated patterns become reusable products.",
    },
    {
      label: "03",
      title: "Subsidiary scale",
      text: "Validated products spin out with focused operators.",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-hairline bg-soft">
      <div className="absolute inset-0 bg-grid opacity-35" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px rule-x" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-12 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.8fr)] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-signal">§ 00 · Structure</p>
            <h2 className="font-display max-w-3xl text-4xl font-semibold leading-tight text-gravity lg:text-6xl">
              Holding company
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gravity/65 lg:text-lg">
              One holding company, three operating layers. Client revenue funds the Labs that build products, and
              mature products spin out into independent subsidiaries.
            </p>
          </div>

          <div className="rounded-lg border border-hairline bg-foundation/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gravity text-foundation">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Parent company</p>
                <p className="mt-1 truncate text-xl font-semibold text-gravity">{parentName}</p>
                <p className="mt-2 text-sm leading-6 text-gravity/60">
                  Capital allocation, product governance, and operating doctrine sit at the centre.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
              <div>
                <p className="text-2xl font-semibold text-gravity">1</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gravity/45">Parent</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gravity">{divisions.length}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gravity/45">Arms</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gravity">{totalUnits}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gravity/45">Units</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-lg border border-hairline bg-foundation/75 p-3 shadow-[var(--shadow-soft)] backdrop-blur md:grid-cols-3">
          {flow.map((step, index) => (
            <div key={step.label} className="rounded-lg border border-hairline bg-foundation/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">{step.label}</p>
                  <p className="mt-2 text-sm font-semibold text-gravity">{step.title}</p>
                </div>
                {index < flow.length - 1 && <ArrowRight className="mt-1 hidden h-4 w-4 text-signal md:block" />}
              </div>
              <p className="mt-3 text-sm leading-6 text-gravity/60">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {divisions.map((div) => {
            const m = meta[div.name] || {
              href: "#",
              icon: <Network className="h-5 w-5" />,
              eyebrow: "Operating arm",
              blurb: "Portfolio layer connected to the holding-company operating model.",
              mandate: "Publish live entries as the portfolio expands.",
            };
            const items: HoldingItem[] = div.items || [];
            const visibleItems = items.map(itemName).filter(Boolean).slice(0, 4);
            return (
              <Link
                key={div.name}
                href={m.href}
                className="group flex min-h-[350px] flex-col rounded-lg border border-hairline bg-foundation/90 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-signal/50 hover:shadow-[var(--shadow-signal)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-hairline bg-soft text-signal transition-colors group-hover:border-signal/40 group-hover:bg-signal/10">
                    {m.icon}
                  </span>
                  <span className="rounded-full border border-hairline bg-soft px-2.5 py-1 text-xs font-semibold text-gravity/55">
                    {items.length} {items.length === 1 ? "unit" : "units"}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{m.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-gravity transition-colors group-hover:text-signal">
                    {div.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-gravity/60">{m.blurb}</p>
                </div>

                <div className="mt-6 border-t border-hairline pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gravity/45">Mandate</p>
                  <p className="mt-2 text-sm leading-6 text-gravity/65">{m.mandate}</p>
                </div>

                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gravity/45">Live entries</p>
                  <ul className="mt-3 space-y-2">
                    {visibleItems.map((name) => (
                      <li key={name} className="flex items-start gap-2 text-sm leading-5 text-gravity/70">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                        <span className="line-clamp-1">{name}</span>
                      </li>
                    ))}
                    {visibleItems.length === 0 && (
                      <li className="text-sm leading-5 text-gravity/40">Portfolio entries publish here when live.</li>
                    )}
                    {items.length > visibleItems.length && (
                      <li className="text-sm font-medium leading-5 text-signal">
                        +{items.length - visibleItems.length} more in the visualiser
                      </li>
                    )}
                  </ul>
                </div>

                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-signal">
                  Open {div.name}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-gravity/55">
            The visualiser shows the full holding-company tree, live units, and the path from client work to durable
            product companies.
          </p>
          <Link
            href="/tools/holding-visualiser"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-signal)] transition-transform hover:-translate-y-0.5"
          >
            Explore the visualiser
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
