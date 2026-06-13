"use client";

import { useState, useMemo } from "react";
import { Activity, ArrowRight, AlertTriangle, Gauge, CheckCircle, RotateCcw, TrendingUp } from "lucide-react";
import Link from "next/link";

const ageWeights = { lt2: 5, two5: 10, five10: 20, gt10: 35 };
const stackWeights = { modern: 5, mixed: 15, legacy: 30, critical: 45 };
const integrationWeights = { few: 5, moderate: 15, many: 25, extensive: 40 };
const changeWeights = { frequent: 5, regular: 10, infrequent: 20, rare: 35 };
const testWeights = { high: 0, moderate: 15, low: 30, none: 45 };
const docWeights = { comprehensive: 0, moderate: 10, minimal: 20, none: 30 };

type AgeKey = keyof typeof ageWeights;
type StackKey = keyof typeof stackWeights;
type IntegrationKey = keyof typeof integrationWeights;
type ChangeKey = keyof typeof changeWeights;
type TestKey = keyof typeof testWeights;
type DocKey = keyof typeof docWeights;

export default function TechDebtEstimatorPage() {
  const [age, setAge] = useState<AgeKey>("two5");
  const [stack, setStack] = useState<StackKey>("mixed");
  const [integrations, setIntegrations] = useState<IntegrationKey>("moderate");
  const [changeFreq, setChangeFreq] = useState<ChangeKey>("regular");
  const [testCoverage, setTestCoverage] = useState<TestKey>("moderate");
  const [documentation, setDocumentation] = useState<DocKey>("moderate");
  const [showResults, setShowResults] = useState(false);

  const result = useMemo(() => {
    const rawScore =
      ageWeights[age] +
      stackWeights[stack] +
      integrationWeights[integrations] +
      changeWeights[changeFreq] +
      testWeights[testCoverage] +
      docWeights[documentation];

    const maxScore = 35 + 45 + 40 + 35 + 45 + 30; // 230
    const percentage = Math.round((rawScore / maxScore) * 100);

    let rating: { label: string; color: string; bg: string; desc: string };
    if (percentage < 30) {
      rating = { label: "Healthy", color: "text-green-400", bg: "bg-green-400/10", desc: "Low technical debt. Systems are well-maintained and modern." };
    } else if (percentage < 50) {
      rating = { label: "Manageable", color: "text-yellow-400", bg: "bg-yellow-400/10", desc: "Moderate debt. Targeted refactoring recommended within 6–12 months." };
    } else if (percentage < 70) {
      rating = { label: "Elevated", color: "text-orange-400", bg: "bg-orange-400/10", desc: "Significant debt. Structured modernisation programme advised." };
    } else {
      rating = { label: "Critical", color: "text-red-400", bg: "bg-red-400/10", desc: "High risk. Urgent intervention required to prevent system failure." };
    }

    const factors = [];
    if (ageWeights[age] >= 20) factors.push("System age is a major contributor");
    if (stackWeights[stack] >= 30) factors.push("Legacy/critical stack increases maintenance burden");
    if (integrationWeights[integrations] >= 25) factors.push("High integration complexity amplifies change cost");
    if (changeWeights[changeFreq] >= 20) factors.push("Infrequent changes suggest knowledge decay");
    if (testWeights[testCoverage] >= 30) factors.push("Poor test coverage increases regression risk");
    if (docWeights[documentation] >= 20) factors.push("Inadequate documentation slows onboarding");

    return { rawScore, maxScore, percentage, rating, factors };
  }, [age, stack, integrations, changeFreq, testCoverage, documentation]);

  return (
    <main>
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">§ 07 · Interactive Tool</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-yellow-400" />
            Tech Debt Estimator
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            A quick diagnostic of your system's technical debt profile. Based on six dimensions 
            used in XCreativs digital systems audits. Not a substitute for a full assessment.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-6">
              <DimensionSelect
                label="System Age"
                icon={<Gauge className="w-4 h-4" />}
                value={age}
                onChange={(v) => setAge(v as AgeKey)}
                options={[
                  { key: "lt2", label: "< 2 years", desc: "Recently built" },
                  { key: "two5", label: "2–5 years", desc: "Mature but current" },
                  { key: "five10", label: "5–10 years", desc: "Legacy emerging" },
                  { key: "gt10", label: "> 10 years", desc: "Significant legacy" },
                ]}
              />

              <DimensionSelect
                label="Technology Stack"
                icon={<AlertTriangle className="w-4 h-4" />}
                value={stack}
                onChange={(v) => setStack(v as StackKey)}
                options={[
                  { key: "modern", label: "Modern / Cloud-native", desc: "Current frameworks, managed services" },
                  { key: "mixed", label: "Mixed", desc: "Some modern, some legacy" },
                  { key: "legacy", label: "Legacy", desc: "End-of-life components, monoliths" },
                  { key: "critical", label: "Critical Legacy", desc: "Unsupported, vendor-locked, fragile" },
                ]}
              />

              <DimensionSelect
                label="Integration Count"
                icon={<Activity className="w-4 h-4" />}
                value={integrations}
                onChange={(v) => setIntegrations(v as IntegrationKey)}
                options={[
                  { key: "few", label: "Few (< 5)", desc: "Minimal external dependencies" },
                  { key: "moderate", label: "Moderate (5–15)", desc: "Standard enterprise integrations" },
                  { key: "many", label: "Many (15–30)", desc: "Complex integration landscape" },
                  { key: "extensive", label: "Extensive (30+)", desc: "High coupling, brittle interfaces" },
                ]}
              />

              <DimensionSelect
                label="Change Frequency"
                icon={<RotateCcw className="w-4 h-4" />}
                value={changeFreq}
                onChange={(v) => setChangeFreq(v as ChangeKey)}
                options={[
                  { key: "frequent", label: "Weekly+", desc: "Continuous deployment" },
                  { key: "regular", label: "Monthly", desc: "Regular release cycle" },
                  { key: "infrequent", label: "Quarterly", desc: "Slow release cycle" },
                  { key: "rare", label: "Yearly / Never", desc: "Change is high-risk" },
                ]}
              />

              <DimensionSelect
                label="Test Coverage"
                icon={<CheckCircle className="w-4 h-4" />}
                value={testCoverage}
                onChange={(v) => setTestCoverage(v as TestKey)}
                options={[
                  { key: "high", label: "> 80%", desc: "Comprehensive automated tests" },
                  { key: "moderate", label: "40–80%", desc: "Partial coverage" },
                  { key: "low", label: "< 40%", desc: "Minimal testing" },
                  { key: "none", label: "None", desc: "No automated tests" },
                ]}
              />

              <DimensionSelect
                label="Documentation"
                icon={<TrendingUp className="w-4 h-4" />}
                value={documentation}
                onChange={(v) => setDocumentation(v as DocKey)}
                options={[
                  { key: "comprehensive", label: "Comprehensive", desc: "Architecture, API, runbooks all current" },
                  { key: "moderate", label: "Moderate", desc: "Some docs, partially current" },
                  { key: "minimal", label: "Minimal", desc: "Basic README only" },
                  { key: "none", label: "None", desc: "Tribal knowledge only" },
                ]}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResults(true)}
                  className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Calculate Debt Score <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShowResults(false); setAge("two5"); setStack("mixed"); setIntegrations("moderate"); setChangeFreq("regular"); setTestCoverage("moderate"); setDocumentation("moderate"); }}
                  className="border border-hairline px-4 py-3 rounded text-sm text-gravity/60 hover:text-gravity transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Results panel */}
            <div className="lg:col-span-1">
              <div className="bg-foundation border border-hairline rounded-lg p-6 sticky top-24">
                {showResults ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-4">Debt Rating</p>
                    <div className="mb-6">
                      <div className="text-5xl font-bold">{result.percentage}%</div>
                      <div className={`mt-2 inline-block px-3 py-1 rounded text-sm font-medium ${result.rating.bg} ${result.rating.color}`}>
                        {result.rating.label}
                      </div>
                      <p className="mt-2 text-sm text-gravity/60">{result.rating.desc}</p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-hairline">
                      <p className="text-sm font-medium mb-2">Score Breakdown</p>
                      <p className="text-2xl font-bold">{result.rawScore} <span className="text-sm text-gravity/40 font-normal">/ {result.maxScore}</span></p>
                    </div>

                    {result.factors.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium mb-3">Key Contributing Factors</p>
                        <ul className="space-y-2">
                          {result.factors.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gravity/70">
                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link
                      href="/contact"
                      className="w-full inline-flex items-center justify-center gap-2 bg-signal text-white px-5 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Book a Systems Audit <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-10 h-10 text-gravity/20 mx-auto mb-3" />
                    <p className="text-sm text-gravity/40">Select parameters and click Calculate to see your tech debt rating.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DimensionSelect({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string; desc: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3 flex items-center gap-1">{icon} {label}</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`text-left border rounded-lg p-3 transition-colors ${
              value === opt.key ? "border-signal bg-signal/5" : "border-hairline bg-foundation hover:border-gravity/30"
            }`}
          >
            <p className={`text-sm font-medium ${value === opt.key ? "text-signal" : "text-gravity"}`}>{opt.label}</p>
            <p className="text-xs text-gravity/50">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
