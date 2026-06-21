"use client";

import { useState } from "react";
import { api } from "@xc/api";
import { FileText, Newspaper, Calculator, CheckCircle, Calendar, Mail } from "lucide-react";
import CustomSelect from "@xc/ui/CustomSelect";
import PageBanner from "@xc/ui/PageBanner";

function errorMessage(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
}

const FIELD_CLASS = "field-x";
const FORM_CARD_CLASS = "panel-x max-w-xl space-y-4 p-6 lg:p-8";
const WIDE_FORM_CARD_CLASS = "panel-x max-w-3xl space-y-5 p-6 lg:p-8";

const SECTOR_OPTIONS = [
  { value: "", label: "Select...", disabled: true },
  { value: "government", label: "Government" },
  { value: "health", label: "Health" },
  { value: "financial_services", label: "Financial Services" },
  { value: "insurance", label: "Insurance" },
  { value: "retail_commerce", label: "Retail & Commerce" },
  { value: "energy", label: "Energy" },
  { value: "education", label: "Education" },
  { value: "ngo_development", label: "NGO & Development" },
];

const SERVICE_LINE_OPTIONS = [
  { value: "", label: "Select...", disabled: true },
  { value: "digital_systems_audit", label: "Digital Systems Audit" },
  { value: "enterprise_government_systems", label: "Enterprise & Government Systems" },
  { value: "ai_automation", label: "AI & Automation" },
  { value: "strategic_web_platforms", label: "Strategic Web & Digital Platforms" },
  { value: "strategy_advisory", label: "Strategy & Advisory" },
];

const INTEGRATION_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "1-3" },
  { value: "4", label: "4-10" },
  { value: "10", label: "10+" },
];

const DATA_VOLUME_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "enterprise", label: "Enterprise" },
];

const USER_COUNT_OPTIONS = [
  { value: "0", label: "< 100" },
  { value: "100", label: "100-1,000" },
  { value: "1000", label: "1,000-10,000" },
  { value: "10000", label: "10,000+" },
];

const COMPLIANCE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "standard", label: "Standard (SOC2)" },
  { value: "regulatory", label: "Regulatory (HIPAA, GDPR)" },
  { value: "national_security", label: "National Security" },
];

const AI_NEEDS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "basic", label: "Basic (classification, search)" },
  { value: "advanced", label: "Advanced (LLM, generation)" },
];

const TIMELINE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "accelerated", label: "Accelerated" },
  { value: "critical", label: "Critical" },
];

const TOPIC_OPTIONS = [
  { value: "", label: "Select...", disabled: true },
  { value: "discovery", label: "Discovery Call (30 min)" },
  { value: "advisory", label: "Advisory Session (60 min)" },
  { value: "technical_review", label: "Technical Review (45 min)" },
  { value: "partnership", label: "Partnership Discussion" },
];

const PREFERRED_TIME_OPTIONS = [
  { value: "", label: "No preference" },
  { value: "morning", label: "Morning (08:00-12:00 GMT)" },
  { value: "afternoon", label: "Afternoon (12:00-17:00 GMT)" },
  { value: "evening", label: "Evening (17:00-20:00 GMT)" },
];

interface EstimateComponent {
  name: string;
  phase: string;
}

interface EstimateResult {
  WeeksBand: string;
  PriceBandUSD: string;
  PriceBandGHS: string;
  Components?: EstimateComponent[];
  SampleArchitecture?: string;
}

export default function ContactPage() {
  const [tab, setTab] = useState<"diagnostic" | "estimate" | "book" | "newsletter">("diagnostic");

  return (
    <>
      <PageBanner
        icon={Mail}
        eyebrow="Start a conversation"
        title="Contact"
        description="Engagement is by qualification, not by enquiry. Serious prospects: begin with the diagnostic."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <main className="shell-x py-16">
      <div className="panel-x mt-10 flex flex-wrap gap-2 p-2">
        {[
          { key: "diagnostic" as const, label: "Diagnostic", icon: FileText },
          { key: "estimate" as const, label: "Scope Estimator", icon: Calculator },
          { key: "book" as const, label: "Book a Call", icon: Calendar },
          { key: "newsletter" as const, label: "Newsletter", icon: Newspaper },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-signal text-white shadow-lg shadow-signal/20"
                : "text-gravity/60 hover:bg-soft hover:text-gravity"
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
    </>
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
    } catch (err: unknown) {
      alert(errorMessage(err) || "Failed to start diagnostic");
    }
  }

  if (submitted) {
    return (
      <div className="card-x p-8">
        <h2 className="text-xl font-semibold">Diagnostic Started</h2>
        <p className="mt-2 text-gravity/60">Your diagnostic ID: {id}</p>
        <p className="mt-4 text-sm text-gravity/60">Our team will review your responses and route you accordingly.</p>
        <a
          href={`/api/v1/diagnostics/${id}/summary.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-x mt-6"
        >
          Download summary (PDF)
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={FORM_CARD_CLASS}>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className={FIELD_CLASS} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" required className={FIELD_CLASS} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Organization</label>
        <input name="organization" required className={FIELD_CLASS} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sector</label>
        <CustomSelect name="sector" required defaultValue="" options={SECTOR_OPTIONS} />
      </div>
      <button type="submit" className="btn-x">
        Start Diagnostic
      </button>
    </form>
  );
}

function EstimateForm() {
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const params: Record<string, string | number | FormDataEntryValue> = {};
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
      setResult(res as EstimateResult);
    } catch (err: unknown) {
      alert(errorMessage(err) || "Failed to generate estimate");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card-x p-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-signal" />
          <h2 className="text-xl font-semibold">Indicative Estimate</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-x p-4">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Timeline</p>
            <p className="text-xl font-bold text-signal">{result.WeeksBand}</p>
          </div>
          <div className="card-x p-4">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Price (USD)</p>
            <p className="text-xl font-bold">{result.PriceBandUSD}</p>
          </div>
          <div className="card-x p-4">
            <p className="text-xs text-gravity/40 uppercase tracking-wider">Price (GHS)</p>
            <p className="text-xl font-bold">{result.PriceBandGHS}</p>
          </div>
        </div>

        {result.Components && result.Components.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-3">Phase Breakdown</h3>
            <div className="space-y-2">
              {result.Components.map((c: EstimateComponent, i: number) => (
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
    <form onSubmit={handleSubmit} className={WIDE_FORM_CARD_CLASS}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" required className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Organization</label>
          <input name="organization" required className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Service Line</label>
          <CustomSelect name="service_line" required defaultValue="" options={SERVICE_LINE_OPTIONS} />
        </div>
      </div>

      <div className="border-t border-hairline pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-4">Complexity Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Integrations</label>
            <CustomSelect name="integrations" options={INTEGRATION_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Volume</label>
            <CustomSelect name="data_volume" options={DATA_VOLUME_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Users</label>
            <CustomSelect name="user_count" options={USER_COUNT_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Compliance</label>
            <CustomSelect name="compliance" options={COMPLIANCE_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">AI Needs</label>
            <CustomSelect name="ai_needs" options={AI_NEEDS_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timeline Urgency</label>
            <CustomSelect name="timeline_urgency" options={TIMELINE_OPTIONS} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-x disabled:opacity-50">
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
    } catch (err: unknown) {
      alert(errorMessage(err) || "Failed to submit booking request");
    }
  }

  if (submitted) {
    return (
      <div className="card-x p-8">
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
    <form onSubmit={handleSubmit} className={FORM_CARD_CLASS}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input name="email" type="email" required className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Organization</label>
          <input name="organization" className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input name="first_name" className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input name="last_name" className={FIELD_CLASS} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Topic *</label>
        <CustomSelect name="topic" required defaultValue="" options={TOPIC_OPTIONS} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Date</label>
          <input name="preferred_date" type="date" className={FIELD_CLASS} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Time</label>
          <CustomSelect name="preferred_time" defaultValue="" options={PREFERRED_TIME_OPTIONS} />
        </div>
      </div>
      <button type="submit" className="btn-x">
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
    } catch (err: unknown) {
      alert(errorMessage(err) || "Failed to subscribe");
    }
  }

  if (done) {
    return (
      <div className="card-x p-8">
        <h2 className="text-xl font-semibold">Subscribed</h2>
        <p className="mt-2 text-gravity/60">Thank you for joining. You will hear from us soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={FORM_CARD_CLASS}>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className={FIELD_CLASS} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input name="first_name" className={FIELD_CLASS} />
      </div>
      <button type="submit" className="btn-x">
        Subscribe
      </button>
    </form>
  );
}
