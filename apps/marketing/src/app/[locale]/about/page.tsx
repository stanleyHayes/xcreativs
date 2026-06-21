import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Quote,
  Building2,
  Hammer,
  Flag,
  Workflow,
  Briefcase,
  FlaskConical,
  Landmark,
  ArrowRight,
} from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

export const metadata: Metadata = {
  title: "About — XCreativs Technologies",
  description:
    "XCreativs Technologies is a Ghanaian sovereign technology company building the intelligent digital systems governments, authorities, and serious enterprises depend on — a long-term infrastructure partner, not a vendor.",
};

// What We Do — the three operating arms (holding-company model).
const ARMS = [
  {
    icon: Briefcase,
    name: "Services",
    blurb:
      "The engagement arm. We partner with governments, authorities, and enterprises to design and build bespoke intelligence systems — from concept and architecture through engineering, deployment, and ongoing operation. Where institutional challenges become working infrastructure.",
  },
  {
    icon: FlaskConical,
    name: "Labs",
    blurb:
      "Our venture studio. We identify problems worth solving at scale and build our own products to solve them — incubating, engineering, and proving them in the market before they stand on their own.",
  },
  {
    icon: Landmark,
    name: "Subsidiaries",
    blurb:
      "Independent companies, born from proven work. When a Labs venture matures into something with its own trajectory, it spins out as a standalone subsidiary with its own brand, team, and mandate — while remaining part of the XCreativs family.",
  },
];

// What We Believe.
const BELIEFS = [
  {
    icon: Building2,
    title: "Infrastructure, not products",
    blurb:
      "A national intelligence platform is not consumer software, and shouldn't be procured, built, or maintained as if it were. We design for permanence, resilience, and institutional ownership — to outlast the projects that create them.",
  },
  {
    icon: Hammer,
    title: "We show, we don't pitch",
    blurb:
      "We don't ask institutions to imagine what we might build. We build it first. Every engagement begins with a working artifact you can use — long before any contract is signed. It is the only honest way to demonstrate capability.",
  },
  {
    icon: Flag,
    title: "Build it here",
    blurb:
      "The default answer to a sovereign digital challenge in Africa has been to import a foreign vendor. We exist to make that the wrong default — world-class national systems, owned by the institutions and the country they serve, not licensed in perpetuity from abroad.",
  },
  {
    icon: Workflow,
    title: "Change the system, not the symptom",
    blurb:
      "We intervene where systems actually change how they behave — their rules, information flows, and incentives — rather than the surface metrics that only look like progress. The difference between a dashboard and a decision.",
  },
];

// How We Work.
const HOW_WE_WORK = [
  {
    title: "Artifact-first",
    blurb:
      "We arrive with a working system, not a slide deck. Before we ask an institution to commit, we've already built something real enough to use. Proof comes before promise.",
  },
  {
    title: "You own the capability. We retain the engine.",
    blurb:
      "Partners receive a perpetual, exclusive licence to the systems we build — durable capability they can rely on indefinitely. We retain the underlying engineering, so the system keeps improving, stays supported, and never becomes a liability our partners maintain alone.",
  },
  {
    title: "Partnership, not procurement",
    blurb:
      "We don't disappear when a system ships. We stay — operating, refining, and extending what we build, with a long-term stake in how well it performs. The relationship is the point.",
  },
  {
    title: "Engineered to a standard",
    blurb:
      "Every system is held to a single, uncompromising engineering standard — in architecture, in code quality, in reliability. The institutions we serve cannot afford systems that merely work in a demo. Ours are built to run.",
  },
];

// The founders — two partners, a clean division of responsibility.
const FOUNDERS = [
  {
    name: "Daniel Nana Kwadwo Baah",
    title: "Co-founder & Chief Executive Officer",
    photo: "/media/founders/daniel-baah.jpg",
    bio:
      "As Chief Executive, Daniel leads XCreativs's strategy, commercial direction, partnerships, and operations. He owns the relationships that bring the company's work into being — translating institutional challenges into engagements, and ensuring every partnership is built on terms that protect both XCreativs and the organisations it serves. He sets the direction; the company executes against it.",
  },
  {
    name: "Stanley Hayford",
    title: "Co-founder & Chief Technology Officer",
    photo: "/media/founders/stanley-hayford.png",
    bio:
      "As Chief Technology Officer, Stanley owns the whole of XCreativs's technical work — architecture, engineering, and the standards every system is held to. He is responsible for how the company's platforms are conceived and built, from the foundational infrastructure shared across engagements to the intelligence capabilities that sit on top of it. The artifact-first doctrine and the engineering standard XCreativs is known for are his to uphold.",
  },
];

const STATS = [
  { value: "Ghana", label: "Engineered in Africa" },
  { value: "3", label: "Operating arms" },
  { value: "Sovereign", label: "By default" },
  { value: "Partner", label: "Not a vendor" },
];

export default function AboutPage() {
  return (
    <>
      <PageBanner
        icon={Compass}
        eyebrow="Who we are"
        title="We build the systems that nations and institutions run on."
        description="XCreativs Technologies is a Ghanaian sovereign technology company building the intelligent digital infrastructure governments, authorities, and serious enterprises depend on — engineered in Africa, owned by the institutions it serves."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      {/* Manifesto */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div className="shell-x relative grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-8">
            <Quote className="h-9 w-9 text-signal/40" />
            <p className="font-display mt-5 text-3xl font-semibold leading-[1.12] tracking-tight lg:text-5xl">
              We are not a software house. The systems we build are too consequential to be bought
              off a shelf and forgotten — we build them as{" "}
              <span className="text-signal">infrastructure</span>, engineered to a standard and
              owned by the institutions they serve.
            </p>
          </div>
          <div className="lg:col-span-4 lg:pt-2">
            <p className="context-label-x">The boilerplate</p>
            <p className="mt-3 text-base leading-relaxed text-gravity/65">
              XCreativs Technologies designs and builds the intelligent digital systems
              governments, authorities, and serious enterprises depend on. We work as a long-term
              infrastructure partner — not a vendor selling software.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gravity/55">
              We bring working systems rather than proposals, and retain the engineering that powers
              them — so our partners gain durable capability, not a one-off project.
            </p>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-hairline bg-soft">
        <div className="shell-x grid grid-cols-2 gap-px overflow-hidden py-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <p className="font-display text-3xl font-semibold tracking-tight text-signal lg:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm font-medium text-gravity/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="shell-x">
        {/* The model — What We Do */}
        <section className="border-b border-hairline py-20">
          <p className="context-label-x mb-3">What we do</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            One company. Three arms. Compounding.
          </h2>
          <p className="mt-4 max-w-2xl text-gravity/60">
            XCreativs operates as a holding company across three tiers — each one strengthening the
            next.
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

        {/* What We Believe */}
        <section className="border-b border-hairline py-20">
          <p className="context-label-x mb-3">What we believe</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            Convictions, not slogans.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BELIEFS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="card-x p-6">
                  <Icon className="h-5 w-5 text-signal" />
                  <h3 className="mt-4 font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gravity/60">{b.blurb}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How We Work */}
        <section className="border-b border-hairline py-20">
          <p className="context-label-x mb-3">How we work</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            The terms of the partnership.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {HOW_WE_WORK.map((w, i) => (
              <div key={w.title} className="flex gap-5">
                <span className="font-display text-2xl font-semibold tabular-nums text-signal/40">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gravity/60">{w.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section className="border-b border-hairline py-20">
          <p className="context-label-x mb-3">Leadership</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            The people accountable.
          </h2>
          <p className="mt-4 max-w-2xl text-gravity/60">
            XCreativs was founded by two partners with a clean division of responsibility: one owns
            the business, the other owns the technology. Together they set the standard the company
            is built to.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {FOUNDERS.map((f) => (
              <article key={f.name} className="card-x overflow-hidden p-0">
                <div className="relative aspect-[3/2] w-full bg-soft">
                  <Image
                    src={f.photo}
                    alt={f.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{f.name}</h3>
                  <p className="text-sm font-medium text-signal">{f.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gravity/60">{f.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Why XCreativs — closing */}
      <section className="relative overflow-hidden bg-[#08090d] text-white">
        <div className="shell-x relative py-24 lg:py-32">
          <p className="context-label-x mb-4 text-white/40">Why XCreativs</p>
          <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight lg:text-5xl">
            The systems that will define Africa&apos;s next decades are being built now.
          </h2>
          <p className="mt-5 max-w-2xl text-white/68">
            The question is by whom, and on whose terms. XCreativs is built to offer the other path —
            world-class engineering, conceived and owned on the continent, delivered by a partner
            with a permanent stake in the outcome. We build the systems that matter most, and we
            build them to stay.
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#08090d] transition-transform hover:-translate-y-0.5 hover:bg-[#5b93ff] hover:text-white"
          >
            Start the conversation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
