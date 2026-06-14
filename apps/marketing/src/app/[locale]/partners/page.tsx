"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@xc/api";
import {
  Handshake,
  CheckCircle,
  Cpu,
  Users,
  Globe,
  FileText,
  TrendingUp,
  ShieldCheck,
  Network,
  ArrowRight,
} from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

const INPUT = "field-x";

const PARTNER_TYPES = [
  { icon: Cpu, name: "Technology", blurb: "Integrate your platform into our solutions — AI, cloud, security, data." },
  { icon: Users, name: "Consulting", blurb: "Co-deliver engagements — strategy, change management, sector expertise." },
  { icon: Globe, name: "Distribution", blurb: "License and deploy XCreativs products in your territory or vertical." },
  { icon: FileText, name: "Content", blurb: "Co-author research and thought leadership that reaches decision-makers." },
];

const BENEFITS = [
  { icon: TrendingUp, title: "Compounding deal flow", blurb: "Plug into national-scale engagements with governments and enterprises." },
  { icon: ShieldCheck, title: "Sovereign-grade standards", blurb: "Ship on a security, compliance, and data-residency baseline clients trust." },
  { icon: Network, title: "A connected group", blurb: "Reach across our services, product labs, and subsidiaries — not a single vendor." },
];

const CRITERIA = [
  "Proven traction in your market",
  "Complementary capability to our service lines",
  "Shared standards for security and compliance",
  "Willingness to co-invest in joint offerings",
];

export default function PartnersPage() {
  const [form, setForm] = useState({
    org_name: "",
    contact_name: "",
    contact_email: "",
    partner_type: "technology",
    target_markets: "",
    existing_product: "",
    domain_expertise: "",
    traction_metrics: "",
    what_they_need: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.applyPartnership({
        ...form,
        target_markets: form.target_markets.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="card-x max-w-md p-10 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/10 text-signal">
            <CheckCircle className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Application received</h1>
          <p className="mx-auto mt-3 text-sm leading-relaxed text-gravity/60">
            Thank you for your interest. Our partnership team reviews every application personally
            and will reach out within 5 business days.
          </p>
          <Link
            href="/"
            className="btn-x mt-6"
          >
            Return home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <PageBanner
        icon={Handshake}
        eyebrow="Partner program"
        title="Partner with us."
        description="We work with technology vendors, consulting firms, and domain experts who can extend our reach or deepen our capability. Not every applicant becomes a partner — the bar is high."
        crumbs={[{ label: "Home", href: "/" }, { label: "Partnership" }]}
      />

      {/* Why partner */}
      <section className="border-b border-hairline">
        <div className="shell-x py-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
            § 01 · Why partner
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            Build on national-scale infrastructure.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="card-x p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-foundation text-signal">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gravity/60">{b.blurb}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partnership types */}
      <section className="border-b border-hairline bg-soft">
        <div className="shell-x py-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
            § 02 · Tracks
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
            Four ways to partner.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_TYPES.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name} className="card-x p-6">
                  <Icon className="h-5 w-5 text-signal" />
                  <h3 className="mt-4 font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gravity/60">{p.blurb}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="border-b border-hairline">
        <div className="shell-x grid grid-cols-1 gap-12 py-20 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gravity/40">
              § 03 · Apply
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight lg:text-4xl">
              Apply to partner.
            </h2>
            <p className="mt-3 max-w-xl text-gravity/60">
              Tell us who you are, what you&apos;ve built, and what you need from XCreativs. We
              review every application personally.
            </p>
            <form onSubmit={handleSubmit} className="card-x mt-8 space-y-4 p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required placeholder="Organisation name *" value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} className={INPUT} />
                <input required placeholder="Contact name *" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className={INPUT} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required type="email" placeholder="Contact email *" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={INPUT} />
                <select value={form.partner_type} onChange={(e) => setForm({ ...form, partner_type: e.target.value })} className={INPUT}>
                  <option value="technology">Technology Partner</option>
                  <option value="consulting">Consulting Partner</option>
                  <option value="distribution">Distribution Partner</option>
                  <option value="content">Content Partner</option>
                </select>
              </div>
              <input value={form.target_markets} onChange={(e) => setForm({ ...form, target_markets: e.target.value })} placeholder="Target markets (comma-separated)" className={INPUT} />
              <input value={form.existing_product} onChange={(e) => setForm({ ...form, existing_product: e.target.value })} placeholder="What product or service do you currently offer?" className={INPUT} />
              <textarea value={form.domain_expertise} onChange={(e) => setForm({ ...form, domain_expertise: e.target.value })} placeholder="What domains or industries do you specialise in?" className={`${INPUT} h-20`} />
              <textarea value={form.traction_metrics} onChange={(e) => setForm({ ...form, traction_metrics: e.target.value })} placeholder="Users, revenue, growth rate, market reach..." className={`${INPUT} h-20`} />
              <textarea required value={form.what_they_need} onChange={(e) => setForm({ ...form, what_they_need: e.target.value })} placeholder="What do you need from XCreativs — intelligence, scale, distribution, compliance...?" className={`${INPUT} h-24`} />
              <button
                type="submit"
                disabled={submitting}
                className="btn-x disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit application"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <aside className="lg:col-span-2">
            <div className="card-x p-7">
              <h3 className="text-lg font-semibold">What we look for</h3>
              <ul className="mt-4 space-y-3">
                {CRITERIA.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-gravity/65">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-hairline pt-6">
                <p className="text-sm leading-relaxed text-gravity/55">
                  The bar is high and intentional. We&apos;d rather have a few partners who
                  compound than a directory of logos.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
