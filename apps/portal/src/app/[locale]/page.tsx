import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, FileCheck2, Network, ShieldCheck, Sparkles } from "lucide-react";

const workspaceStats = [
  { value: "24/7", label: "protected access" },
  { value: "MFA", label: "ready sign-in" },
  { value: "Live", label: "engagement context" },
];

const portalTracks = [
  {
    icon: BriefcaseBusiness,
    title: "Engagement command",
    text: "Milestones, decisions, risks, support tickets, demos, and reports stay tied to the workstream.",
  },
  {
    icon: FileCheck2,
    title: "Document control",
    text: "Deliverables, invoices, approval workflows, and signed assets live behind scoped workspace access.",
  },
  {
    icon: Network,
    title: "Partner operations",
    text: "Products, agreements, referrals, orders, and commission activity are visible for eligible partners.",
  },
];

export default async function PortalLanding() {
  const locale = await getLocale();

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gravity text-foundation">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" />
      <div aria-hidden className="rule-x absolute inset-x-0 top-0 h-px opacity-50" />

      <div className="shell-x relative grid min-h-screen items-center gap-10 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-20">
        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-signal" />
            Secure workspace
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Image src="/logo.svg" alt="XCreativs" width={48} height={48} priority className="h-12 w-12" />
            <div>
              <p className="font-display text-2xl font-semibold">XCreativs</p>
              <p className="text-sm text-white/45">Client, admin, and partner operations</p>
            </div>
          </div>

          <h1 className="font-display mt-10 max-w-2xl text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl">
            Portal
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/64 lg:text-lg">
            A protected command surface for the work in motion: engagement health, delivery evidence, decisions, approvals, partner activity, and the operational trail around every client relationship.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/login`} className="portal-btn-x">
              Sign in to portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="portal-chip-x px-3 py-2 text-white/52">SSO options available after sign-in opens</span>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {workspaceStats.map((item) => (
              <div key={item.label} className="portal-card-x p-4">
                <p className="font-display text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-white/45">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-panel-x p-5 sm:p-6 lg:p-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="portal-meta-x">Workspace coverage</p>
              <h2 className="font-display mt-2 text-2xl font-semibold">One operational layer for delivery.</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-signal/25 bg-signal/10 text-signal">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {portalTracks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="portal-card-x p-4">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-signal">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/52">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="portal-card-x mt-5 p-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-signal" />
              <div>
                <p className="text-sm font-semibold">Access is role-scoped and engagement-aware.</p>
                <p className="mt-1 text-xs text-white/42">Your available modules update with your workspace permissions.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
