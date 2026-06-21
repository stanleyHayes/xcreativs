"use client";

import { useState, useMemo } from "react";
import { DollarSign, ArrowRight, Clock, Users, Shield, Gauge, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@xc/ui/CurrencyProvider";
import BannerWatermark from "@xc/ui/BannerWatermark";

const complexityMultipliers = {
  standard: 1.0,
  complex: 1.6,
  enterprise: 2.5,
};

const urgencyMultipliers = {
  standard: 1.0,
  expedited: 1.35,
  critical: 1.8,
};

const teamMultipliers = {
  small: 0.85,
  medium: 1.0,
  large: 1.4,
};

const sovereigntyMultipliers = {
  shared: 1.0,
  hybrid: 1.25,
  full: 1.6,
};

const baseScopes: Record<string, { min: number; max: number; weeksMin: number; weeksMax: number; components: string[] }> = {
  "audit": { min: 15000, max: 45000, weeksMin: 2, weeksMax: 6, components: ["Discovery workshops", "Systems inventory", "Architecture review", "Gap analysis report", "Remediation roadmap"] },
  "platform": { min: 45000, max: 150000, weeksMin: 8, weeksMax: 20, components: ["UX research & design", "Frontend development", "Backend architecture", "Database design", "CI/CD pipeline", "QA & testing", "Launch support"] },
  "enterprise": { min: 85000, max: 350000, weeksMin: 16, weeksMax: 40, components: ["Stakeholder alignment", "Enterprise architecture", "Multi-module development", "Integration layer", "Security hardening", "Performance testing", "Change management", "Training & handover"] },
  "ai": { min: 65000, max: 250000, weeksMin: 12, weeksMax: 32, components: ["Data audit & preparation", "Model selection & training", "Integration architecture", "Inference pipeline", "Monitoring & drift detection", "Ethics & compliance review"] },
  "advisory": { min: 12000, max: 85000, weeksMin: 4, weeksMax: 16, components: ["Executive interviews", "Market analysis", "Operating model design", "Governance framework", "Board presentation"] },
};

export default function CostCalculatorPage() {
  const [scope, setScope] = useState("platform");
  const [complexity, setComplexity] = useState<keyof typeof complexityMultipliers>("standard");
  const [urgency, setUrgency] = useState<keyof typeof urgencyMultipliers>("standard");
  const [team, setTeam] = useState<keyof typeof teamMultipliers>("medium");
  const [sovereignty, setSovereignty] = useState<keyof typeof sovereigntyMultipliers>("shared");

  const estimate = useMemo(() => {
    const base = baseScopes[scope];
    const mult = complexityMultipliers[complexity] * urgencyMultipliers[urgency] * teamMultipliers[team] * sovereigntyMultipliers[sovereignty];
    return {
      min: Math.round(base.min * mult),
      max: Math.round(base.max * mult),
      weeksMin: Math.round(base.weeksMin * (urgency === "critical" ? 0.7 : urgency === "expedited" ? 0.85 : 1)),
      weeksMax: Math.round(base.weeksMax * (urgency === "critical" ? 0.7 : urgency === "expedited" ? 0.85 : 1)),
      components: base.components,
    };
  }, [scope, complexity, urgency, team, sovereignty]);

  const { format } = useCurrency();
  const formatCurrency = (n: number) => format(n);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={DollarSign} />
        <div className="shell-x relative py-16 lg:py-20">
          <p className="context-label-x mb-4">Engagement estimator</p>
          <h1 className="font-display flex items-center gap-3 text-4xl font-semibold tracking-tight lg:text-5xl">
            <DollarSign className="w-8 h-8 text-green-400" />
            Engagement Cost Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            Indicative pricing for common engagement scopes. Actual investment depends on discovery outcomes, 
            integration complexity, and regulatory requirements. All estimates include phased payment terms.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="panel-x space-y-7 p-6 lg:col-span-2 lg:p-8">
              {/* Scope */}
              <div>
                <label className="block text-sm font-medium mb-3">Engagement Scope</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: "audit", label: "Systems Audit", desc: "Assessment & roadmap" },
                    { key: "platform", label: "Web Platform", desc: "Public surface build" },
                    { key: "enterprise", label: "Enterprise System", desc: "National-scale platform" },
                    { key: "ai", label: "AI Integration", desc: "Intelligence layer" },
                    { key: "advisory", label: "Strategy & Advisory", desc: "Operating design" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setScope(s.key)}
                      className={`text-left border rounded-2xl p-4 transition-colors ${
                        scope === s.key ? "border-signal bg-signal/10 shadow-[0_12px_30px_-24px_var(--color-signal)]" : "border-hairline bg-foundation hover:border-signal/40"
                      }`}
                    >
                      <p className={`text-sm font-medium ${scope === s.key ? "text-signal" : "text-gravity"}`}>{s.label}</p>
                      <p className="text-xs text-gravity/50">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-1"><Gauge className="w-4 h-4" /> Complexity</label>
                <div className="flex gap-2">
                  {([
                    { key: "standard", label: "Standard" },
                    { key: "complex", label: "Complex" },
                    { key: "enterprise", label: "Enterprise" },
                  ] as const).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setComplexity(c.key)}
                      className={`flex-1 border rounded-full px-3 py-2 text-sm transition-colors ${
                        complexity === c.key ? "border-signal bg-signal/10 text-signal font-medium" : "border-hairline bg-foundation text-gravity/70 hover:border-signal/40"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-1"><Clock className="w-4 h-4" /> Urgency</label>
                <div className="flex gap-2">
                  {([
                    { key: "standard", label: "Standard (8–12 wks)" },
                    { key: "expedited", label: "Expedited (5–8 wks)" },
                    { key: "critical", label: "Critical (3–5 wks)" },
                  ] as const).map((u) => (
                    <button
                      key={u.key}
                      onClick={() => setUrgency(u.key)}
                      className={`flex-1 border rounded-full px-3 py-2 text-sm transition-colors ${
                        urgency === u.key ? "border-signal bg-signal/10 text-signal font-medium" : "border-hairline bg-foundation text-gravity/70 hover:border-signal/40"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-1"><Users className="w-4 h-4" /> Team Size</label>
                <div className="flex gap-2">
                  {([
                    { key: "small", label: "Lean (2–3)" },
                    { key: "medium", label: "Standard (4–6)" },
                    { key: "large", label: "Full (7–10)" },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTeam(t.key)}
                      className={`flex-1 border rounded-full px-3 py-2 text-sm transition-colors ${
                        team === t.key ? "border-signal bg-signal/10 text-signal font-medium" : "border-hairline bg-foundation text-gravity/70 hover:border-signal/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sovereignty */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-1"><Shield className="w-4 h-4" /> Data Sovereignty</label>
                <div className="flex gap-2">
                  {([
                    { key: "shared", label: "Shared Cloud" },
                    { key: "hybrid", label: "Hybrid" },
                    { key: "full", label: "Sovereign (On-prem)" },
                  ] as const).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSovereignty(s.key)}
                      className={`flex-1 border rounded-full px-3 py-2 text-sm transition-colors ${
                        sovereignty === s.key ? "border-signal bg-signal/10 text-signal font-medium" : "border-hairline bg-foundation text-gravity/70 hover:border-signal/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimate panel */}
            <div className="lg:col-span-1">
              <div className="panel-x sticky top-24 p-6">
                <p className="kicker-x mb-4">Estimated Investment</p>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-signal">
                    {formatCurrency(estimate.min)} — {formatCurrency(estimate.max)}
                  </p>
                  <p className="text-sm text-gravity/50 mt-1">Excluding disbursements</p>
                </div>

                <div className="mb-6 pb-6 border-b border-hairline">
                  <p className="text-sm font-medium mb-1">Timeline</p>
                  <p className="text-2xl font-bold">{estimate.weeksMin} — {estimate.weeksMax} weeks</p>
                  <p className="text-xs text-gravity/50 mt-1">From kickoff to handover</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">Likely Components</p>
                  <ul className="space-y-2">
                    {estimate.components.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-gravity/70">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/contact"
                  className="btn-x w-full"
                >
                  Request Detailed Proposal <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-gravity/40 mt-3 text-center">
                  This is an indicative estimate. Final pricing follows discovery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
