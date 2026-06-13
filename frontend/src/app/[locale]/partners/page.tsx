"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Handshake, CheckCircle } from "lucide-react";

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
      <main className="min-h-screen flex items-center justify-center bg-foundation">
        <div className="text-center px-6">
          <CheckCircle className="w-12 h-12 text-signal mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Application Received</h1>
          <p className="text-gravity/60 max-w-md mx-auto">
            Thank you for your interest. Our partnership team will review your application and reach out within 5 business days.
          </p>
          <Link href="/" className="mt-6 inline-block text-signal font-medium hover:underline">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20 lg:py-28">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">§ 04 · Partner & Collaborator</p>
          <h1 className="text-3xl lg:text-5xl font-bold">Partnership</h1>
          <p className="mt-6 max-w-2xl text-lg text-gravity/70 leading-relaxed">
            We work with technology vendors, consulting firms, and domain experts who can extend our reach or deepen our capability. Not every applicant becomes a partner. The bar is high.
          </p>
        </div>
      </section>

      {/* Application form */}
      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Apply to partner</h2>
              <p className="text-gravity/60 mb-8">
                Tell us who you are, what you have built, and what you need from XCreativs. We review every application personally.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Organisation Name *" value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
                <input required placeholder="Contact Name *" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
                <input required type="email" placeholder="Contact Email *" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
                <select value={form.partner_type} onChange={(e) => setForm({ ...form, partner_type: e.target.value })} className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation">
                  <option value="technology">Technology Partner</option>
                  <option value="consulting">Consulting Partner</option>
                  <option value="distribution">Distribution Partner</option>
                  <option value="content">Content Partner</option>
                </select>
                <input value={form.target_markets} onChange={(e) => setForm({ ...form, target_markets: e.target.value })} placeholder="Target markets (comma-separated)" className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
                <input value={form.existing_product} onChange={(e) => setForm({ ...form, existing_product: e.target.value })} placeholder="What product or service do you currently offer?" className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
                <textarea value={form.domain_expertise} onChange={(e) => setForm({ ...form, domain_expertise: e.target.value })} placeholder="What domains or industries do you specialise in?" className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-20" />
                <textarea value={form.traction_metrics} onChange={(e) => setForm({ ...form, traction_metrics: e.target.value })} placeholder="Users, revenue, growth rate, market reach..." className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-20" />
                <textarea required value={form.what_they_need} onChange={(e) => setForm({ ...form, what_they_need: e.target.value })} placeholder="Intelligence, scale, distribution, compliance..." className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-24" />
                <button type="submit" disabled={submitting} className="bg-signal text-white px-6 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">What we look for</h3>
                <ul className="space-y-2 text-gravity/60 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Proven traction in your market</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Complementary capability to our service lines</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Shared standards for security and compliance</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" /> Willingness to co-invest in joint offerings</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Partnership types</h3>
                <div className="space-y-3 text-sm">
                  <div className="border border-hairline rounded p-4">
                    <p className="font-medium">Technology</p>
                    <p className="text-gravity/60">Integrate your platform into our solutions. AI, cloud, security, data.</p>
                  </div>
                  <div className="border border-hairline rounded p-4">
                    <p className="font-medium">Consulting</p>
                    <p className="text-gravity/60">Co-deliver engagements. Strategy, change management, sector expertise.</p>
                  </div>
                  <div className="border border-hairline rounded p-4">
                    <p className="font-medium">Distribution</p>
                    <p className="text-gravity/60">License and deploy XCreativs products in your territory or vertical.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
