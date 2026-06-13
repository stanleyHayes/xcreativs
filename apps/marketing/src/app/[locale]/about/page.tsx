import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Briefcase,
  FlaskConical,
  Landmark,
  ShieldCheck,
  Boxes,
  TrendingUp,
  Crosshair,
  ArrowRight,
  Quote,
} from "lucide-react";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "About — XCreativs Technologies",
  description:
    "XCreativs is a sovereign-by-design technology group building national-scale digital systems for governments and enterprises — across services, product labs, and spun-out subsidiaries.",
};

interface AboutFounder {
  name?: string;
  title?: string;
}

interface AboutData {
  mission?: string;
  founders?: AboutFounder[];
}

interface AboutPageResponse {
  Data?: AboutData;
}

async function getAbout(): Promise<AboutPageResponse | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/pages/about`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json() as Promise<AboutPageResponse>;
}

const ARMS = [
  {
    icon: Briefcase,
    name: "Services",
    blurb:
      "Client engagements — audits, architecture, and national-scale system delivery. The revenue engine that funds everything the group builds.",
  },
  {
    icon: FlaskConical,
    name: "Labs",
    blurb:
      "The product arm. Where recurring problems become durable products — like ILIVVON, our health-intelligence platform.",
  },
  {
    icon: Landmark,
    name: "Subsidiaries",
    blurb:
      "Products that outgrow the Labs spin out into independent, self-standing companies — extending the group's reach.",
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Sovereign by default",
    blurb:
      "Self-hosted, data-resident, and engineered so institutions own their stack — never their vendors.",
  },
  {
    icon: Boxes,
    title: "Architecture first",
    blurb:
      "We design the system before the screen. Every engagement opens with the architecture for the next 18–36 months.",
  },
  {
    icon: TrendingUp,
    title: "Compound infrastructure",
    blurb:
      "We build assets that accrue — platforms and capabilities that keep paying off long after launch day.",
  },
  {
    icon: Crosshair,
    title: "Serious firms only",
    blurb:
      "We partner with governments and enterprises that treat technology as core infrastructure, not a line item.",
  },
];

const STATS = [
  { value: "3", label: "Operating arms" },
  { value: "5", label: "Service lines" },
  { value: "EN · FR", label: "Bilingual delivery" },
  { value: "National", label: "Scale by default" },
];

export default async function AboutPage() {
  const page = await getAbout();
  const data: AboutData = page?.Data || {};
  const mission =
    data.mission ||
    "To build intelligent digital systems that give governments and enterprises strategic advantage — sovereign by design, and engineered to compound.";

  return (
    <>
      <PageBanner
        icon={Compass}
        eyebrow="Who we are"
        title="A sovereign technology group."
        description="XCreativs builds the digital infrastructure that governments and enterprises cannot operate without — across services, product labs, and independent subsidiaries."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      {/* Manifesto */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-[10%] top-[-40%] h-[40vmax] w-[40vmax] rounded-full bg-signal/10 blur-[130px]"
        />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
          <div className="lg:col-span-8">
            <Quote className="h-9 w-9 text-signal/40" />
            <p className="font-display mt-5 text-3xl font-semibold leading-[1.12] tracking-tight lg:text-5xl">
              We don&apos;t build websites. We build infrastructure that governments and
              enterprises <span className="text-gradient">cannot operate without</span>.
            </p>
          </div>
          <div className="lg:col-span-4 lg:pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Mission</p>
            <p className="mt-3 text-base leading-relaxed text-gravity/65">{mission}</p>
            <p className="mt-4 text-base leading-relaxed text-gravity/55">
              Self-hosted, sovereignty-conscious, and bilingual by design — so the institutions we
              serve stay in control of their own systems.
            </p>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px overflow-hidden px-6 py-4 lg:grid-cols-4 lg:px-12">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <p className="font-display text-3xl font-semibold tracking-tight text-signal lg:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gravity/45">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-6 lg:px-12">
        {/* The model */}
        <section className="border-b border-hairline py-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
            § 01 · The model
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            One company. Three arms. Compounding.
          </h2>
          <p className="mt-4 max-w-2xl text-gravity/60">
            Client revenue funds the Labs that build products, which spin out into independent
            subsidiaries. Each arm strengthens the next.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {ARMS.map((arm) => {
              const Icon = arm.icon;
              return (
                <div key={arm.name} className="card-x p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-foundation text-signal">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{arm.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gravity/60">{arm.blurb}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Principles */}
        <section className="border-b border-hairline py-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
            § 02 · Operating principles
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            How we build.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="card-x p-6">
                  <Icon className="h-5 w-5 text-signal" />
                  <h3 className="mt-4 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gravity/60">{p.blurb}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Leadership */}
        {data.founders && data.founders.length > 0 && (
          <section className="border-b border-hairline py-20">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
              § 03 · Leadership
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
              The people accountable.
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.founders.map((f, i) => (
                <div key={i} className="card-x flex items-center gap-4 p-6">
                  <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-signal/10 text-lg font-semibold text-signal">
                    {(f.name || "?").charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-sm text-gravity/55">{f.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gravity text-foundation">
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -left-[8%] bottom-[-50%] h-[36vmax] w-[36vmax] rounded-full bg-signal/25 blur-[130px]"
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-24 lg:px-12 lg:py-32">
          <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight lg:text-5xl">
            Build something institutions depend on.
          </h2>
          <p className="mt-4 max-w-xl text-foundation/65">
            Serious prospects only. Begin with the engagement readiness diagnostic.
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-signal/30 transition-transform hover:-translate-y-0.5"
          >
            Start the conversation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
