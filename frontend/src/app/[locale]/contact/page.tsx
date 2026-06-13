"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ArrowRight, FileText, Newspaper, Calculator, CheckCircle, Calendar } from "lucide-react";

export default function ContactPage() {
  const [tab, setTab] = useState<"diagnostic" | "estimate" | "book" | "newsletter">("diagnostic");

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Contact</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Engagement is by qualification, not by enquiry. Serious prospects: begin with the diagnostic.
      </p>

      <div className="mt-10 flex gap-4 border-b border-hairline">
        {[
          { key: "diagnostic" as const, label: "Diagnostic", icon: FileText },
          { key: "estimate" as const, label: "Scope Estimator", icon: Calculator },
          { key: "book" as const, label: "Book a Call", icon: Calendar },
          { key: "newsletter" as const, label: "Newsletter", icon: Newspaper },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-signal text-signal"
                : "border-transparent text-gravity/60 hover:text-gravity"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "diagnostic" && <DiagnosticForm />}
        {tab === "estimate" && <EstimateForm />}
        {tab === "book" && <BookingForm />}
        {tab === "newsletter" && <NewsletterForm />}
      </div>
    </main>
  );
}

function DiagnosticForm() {
  const [submitted, setSubmitted] = useState(false);
  const [id, setId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.startDiagnostic({
        email: fd.get("email"),
        prospect_name: fd.get("name"),
        organization: fd.get("organization"),
        sector: fd.get("sector"),
      });
      setId(res.diagnostic_id);
      setSubmitted(true);
    } catch (err: any) {
      alert(err?.message || "Failed to start diagnostic");
    }
  }

  if (submitted) {
    return (
      <div className="border border-hairline rounded p-8 bg-soft">
        <h2 className="text-xl font-semibold">Diagnostic Started</h2>
        <p className="mt-2 text-gravity/60">Your diagnostic ID: {id}</p>
        <p className="mt-4 text-sm text-gravity/60">Our team will review your responses and route you accordingly.</p>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/diagnostics/${id}/summary.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-signal text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Download summary (PDF)
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Organization</label>
        <input name="organization" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sector</label>
        <select name="sector" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
          <option value="">Select...</option>
          <option value="government">Government</option>
          <option value="health">Health</option>
          <option value="financial_services">Financial Services</option>
          <option value="insurance">Insurance</option>
          <option value="retail_commerce">Retail & Commerce</option>
          <option value="energy">Energy</option>
          <option value="education">Education</option>
          <option value="ngo_development">NGO & Development</option>
        </select>
      </div>
      <button type="submit" className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity">
        Start Diagnostic
      </button>
    </form>
  );
}

function EstimateForm() {
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const params: Record<string, any> = {};
    const integrations = fd.get("integrations");
    if (integrations) params.integrations = parseInt(integrations as string);
    const users = fd.get("user_count");
    if (users) params.user_count = parseInt(users as string);
    const dv = fd.get("data_volume");
    if (dv) params.data_volume = dv;
    const comp = fd.get("compliance");
    if (comp) params.compliance = comp;
    const ai = fd.get("ai_needs");
    if (ai) params.ai_needs = ai;
    const urg = fd.get("timeline_urgency");
    if (urg) params.timeline_urgency = urg;

    try {
      const res = await api.createEstimate({
        email: fd.get("email"),
        prospect_name: fd.get("name"),
        organization: fd.get("organization"),
        service_line: fd.get("service_line"),
        parameters: params,
      });
      setResult(res);
    } catch (err: any) {
      alert(err?.message || "Failed to generate estimate");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-hairline rounded p-8 bg-soft">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-signal" />
          <h2 className="text-xl font-semibold">Indicative Estimate</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-hairline rounded p-4 bg-foundation">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Timeline</p>
            <p className="text-xl font-bold text-signal">{result.WeeksBand}</p>
          </div>
          <div className="border border-hairline rounded p-4 bg-foundation">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Price (USD)</p>
            <p className="text-xl font-bold">{result.PriceBandUSD}</p>
          </div>
          <div className="border border-hairline rounded p-4 bg-foundation">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Price (GHS)</p>
            <p className="text-xl font-bold">{result.PriceBandGHS}</p>
          </div>
        </div>

        {result.Components && result.Components.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-3">Phase Breakdown</h3>
            <div className="space-y-2">
              {result.Components.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-gravity/50">{c.phase}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.SampleArchitecture && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-2">Sample Architecture</h3>
            <p className="text-sm text-gravity/70 leading-relaxed">{result.SampleArchitecture}</p>
          </div>
        )}

        <p className="mt-4 text-xs text-gravity/40">This is not a binding quote. A team member will follow up within 48 hours to refine based on your specific constraints.</p>
        <button onClick={() => setResult(null)} className="mt-4 text-sm text-signal hover:underline">Start new estimate</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Organization</label>
          <input name="organization" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Service Line</label>
          <select name="service_line" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
            <option value="">Select...</option>
            <option value="digital_systems_audit">Digital Systems Audit</option>
            <option value="enterprise_government_systems">Enterprise & Government Systems</option>
            <option value="ai_automation">AI & Automation</option>
            <option value="strategic_web_platforms">Strategic Web & Digital Platforms</option>
            <option value="strategy_advisory">Strategy & Advisory</option>
          </select>
        </div>
      </div>

      <div className="border-t border-hairline pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-4">Complexity Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Integrations</label>
            <select name="integrations" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="0">None</option>
              <option value="1">1–3</option>
              <option value="4">4–10</option>
              <option value="10">10+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Volume</label>
            <select name="data_volume" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Users</label>
            <select name="user_count" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="0">&lt; 100</option>
              <option value="100">100–1,000</option>
              <option value="1000">1,000–10,000</option>
              <option value="10000">10,000+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Compliance</label>
            <select name="compliance" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="none">None</option>
              <option value="standard">Standard (SOC2)</option>
              <option value="regulatory">Regulatory (HIPAA, GDPR)</option>
              <option value="national_security">National Security</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">AI Needs</label>
            <select name="ai_needs" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="none">None</option>
              <option value="basic">Basic (classification, search)</option>
              <option value="advanced">Advanced (LLM, generation)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timeline Urgency</label>
            <select name="timeline_urgency" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
              <option value="standard">Standard</option>
              <option value="accelerated">Accelerated</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {submitting ? "Calculating..." : "Get Estimate"}
      </button>
    </form>
  );
}

function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [id, setId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.createBooking({
        email: fd.get("email"),
        first_name: fd.get("first_name"),
        last_name: fd.get("last_name"),
        organization: fd.get("organization"),
        topic: fd.get("topic"),
        preferred_date: fd.get("preferred_date"),
        preferred_time: fd.get("preferred_time"),
      });
      setId(res.booking_id);
      setSubmitted(true);
    } catch (err: any) {
      alert(err?.message || "Failed to submit booking request");
    }
  }

  if (submitted) {
    return (
      <div className="border border-hairline rounded p-8 bg-soft">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-signal" />
          <h2 className="text-xl font-semibold">Booking Requested</h2>
        </div>
        <p className="text-gravity/60">Booking ID: {id}</p>
        <p className="mt-4 text-sm text-gravity/60">
          We will review your request and confirm within 24 hours. A calendar invite will follow.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input name="email" type="email" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Organization</label>
          <input name="organization" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input name="first_name" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input name="last_name" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Topic *</label>
        <select name="topic" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
          <option value="">Select...</option>
          <option value="discovery">Discovery Call (30 min)</option>
          <option value="advisory">Advisory Session (60 min)</option>
          <option value="technical_review">Technical Review (45 min)</option>
          <option value="partnership">Partnership Discussion</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Date</label>
          <input name="preferred_date" type="date" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Time</label>
          <select name="preferred_time" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal">
            <option value="">No preference</option>
            <option value="morning">Morning (08:00–12:00 GMT)</option>
            <option value="afternoon">Afternoon (12:00–17:00 GMT)</option>
            <option value="evening">Evening (17:00–20:00 GMT)</option>
          </select>
        </div>
      </div>
      <button type="submit" className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity">
        Request Booking
      </button>
    </form>
  );
}

function NewsletterForm() {
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.subscribeNewsletter({
        email: fd.get("email"),
        first_name: fd.get("first_name"),
        segments: ["general"],
      });
      setDone(true);
    } catch (err: any) {
      alert(err?.message || "Failed to subscribe");
    }
  }

  if (done) {
    return (
      <div className="border border-hairline rounded p-8 bg-soft">
        <h2 className="text-xl font-semibold">Subscribed</h2>
        <p className="mt-2 text-gravity/60">Thank you for joining. You will hear from us soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input name="first_name" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal" />
      </div>
      <button type="submit" className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity">
        Subscribe
      </button>
    </form>
  );
}
