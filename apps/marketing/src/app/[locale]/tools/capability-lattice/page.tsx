"use client";

import { useState } from "react";
import Link from "next/link";
import { Grid3X3, X, CheckCircle, ArrowUpRight } from "lucide-react";
import BannerWatermark from "@xc/ui/BannerWatermark";

const sectors = [
  "Government & Public Sector",
  "Healthcare",
  "Financial Services",
  "Education",
  "Agriculture",
  "Energy & Utilities",
  "Logistics & Transport",
  "Telecommunications",
];

const capabilities = [
  "Digital Systems Audit",
  "Enterprise Development",
  "AI & Automation",
  "Strategic Platforms",
  "Data Architecture",
  "Cloud & Infrastructure",
  "Cybersecurity",
  "Product Strategy",
];

interface Intersection {
  approach: string;
  precedent: string;
  depth: "deep" | "proven" | "available" | "nascent";
}

const latticeData: Record<string, Record<string, Intersection>> = {
  "Government & Public Sector": {
    "Digital Systems Audit": { approach: "National-scale digital posture assessment with sovereignty frameworks. 24H+ AIA methodology.", precedent: "24-Hour Economy Authority of Ghana", depth: "deep" },
    "Enterprise Development": { approach: "Custom government platforms with inter-agency integration and legislative compliance.", precedent: "National Health Information System", depth: "deep" },
    "AI & Automation": { approach: "Predictive analytics for resource allocation, fraud detection, and citizen service routing.", precedent: "Revenue Intelligence Platform", depth: "proven" },
    "Strategic Platforms": { approach: "Public-facing digital infrastructure with integrated service delivery and analytics.", precedent: "24H+ Public Portal", depth: "deep" },
    "Data Architecture": { approach: "National data lakes with federated governance and cross-ministry interoperability.", precedent: "Central Statistics Office", depth: "proven" },
    "Cloud & Infrastructure": { approach: "Sovereign cloud deployment with local data residency and disaster recovery.", precedent: "Ministry of Finance", depth: "proven" },
    "Cybersecurity": { approach: "National CERT alignment, threat intelligence sharing, and critical infrastructure protection.", precedent: "National Cybersecurity Agency", depth: "available" },
    "Product Strategy": { approach: "Digital transformation roadmaps with phased implementation and change management.", precedent: "e-Governance Masterplan", depth: "proven" },
  },
  "Healthcare": {
    "Digital Systems Audit": { approach: "Clinical workflow assessment, EHR maturity evaluation, and regulatory gap analysis.", precedent: "Fastcare Clinics", depth: "deep" },
    "Enterprise Development": { approach: "Hospital management systems with patient portals, billing, and pharmacy integration.", precedent: "ILIVVON Health Intelligence", depth: "deep" },
    "AI & Automation": { approach: "Diagnostic support, predictive triage, and population health analytics.", precedent: "ILIVVON AI Triage Module", depth: "deep" },
    "Strategic Platforms": { approach: "Patient-facing platforms with appointment scheduling, telemedicine, and health records.", precedent: "Fastcare Patient Portal", depth: "proven" },
    "Data Architecture": { approach: "FHIR-compliant data exchange, donor intelligence, and epidemiological surveillance.", precedent: "ILIVVON Data Layer", depth: "deep" },
    "Cloud & Infrastructure": { approach: "HIPAA-aligned cloud with edge computing for rural clinic connectivity.", precedent: "ILIVVON Rural Extension", depth: "proven" },
    "Cybersecurity": { approach: "Patient data protection, breach response, and medical device security.", precedent: "Fastcare Security Audit", depth: "available" },
    "Product Strategy": { approach: "Digital health product roadmaps from pilot to national scale.", precedent: "ILIVVON Go-to-Market", depth: "deep" },
  },
  "Financial Services": {
    "Digital Systems Audit": { approach: "Core banking assessment, payment gateway evaluation, and compliance readiness.", precedent: "Regional Bank Digital Audit", depth: "proven" },
    "Enterprise Development": { approach: "Core banking platforms, mobile money integration, and API marketplaces.", precedent: "Fintech Integration Platform", depth: "proven" },
    "AI & Automation": { approach: "Credit scoring, fraud detection, and algorithmic trading infrastructure.", precedent: "Credit Risk Engine", depth: "available" },
    "Strategic Platforms": { approach: "Customer-facing banking apps with biometric auth and real-time notifications.", precedent: "Neo-Bank Mobile App", depth: "available" },
    "Data Architecture": { approach: "Real-time transaction processing, regulatory reporting, and customer analytics.", precedent: "Bank Data Warehouse", depth: "proven" },
    "Cloud & Infrastructure": { approach: "Financial-grade infrastructure with 99.99% SLA and multi-region failover.", precedent: "Payment Processor Cloud", depth: "available" },
    "Cybersecurity": { approach: "PCI-DSS compliance, penetration testing, and security operations centre design.", precedent: "Bank SOC Implementation", depth: "available" },
    "Product Strategy": { approach: "Digital banking transformation with customer journey mapping and feature prioritisation.", precedent: "Retail Bank Digital Strategy", depth: "available" },
  },
};

const depthConfig = {
  deep: { label: "Deep", color: "bg-signal text-white", dot: "bg-signal" },
  proven: { label: "Proven", color: "bg-green-400/20 text-green-700", dot: "bg-green-400" },
  available: { label: "Available", color: "bg-yellow-400/20 text-yellow-700", dot: "bg-yellow-400" },
  nascent: { label: "Nascent", color: "bg-white/10 text-white/50", dot: "bg-white/30" },
};

function getIntersection(sector: string, capability: string): Intersection {
  return latticeData[sector]?.[capability] || {
    approach: `XCreativs has emerging capability in ${capability.toLowerCase()} for the ${sector.toLowerCase()} sector. Contact us for a scoped assessment.`,
    precedent: "",
    depth: "nascent",
  };
}

export default function CapabilityLatticePage() {
  const [selected, setSelected] = useState<{ sector: string; capability: string } | null>(null);

  const activeIntersection = selected ? getIntersection(selected.sector, selected.capability) : null;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={Grid3X3} />
        <div className="shell-x relative py-16 lg:py-20">
          <p className="context-label-x mb-4">Capability matrix</p>
          <h1 className="font-display flex items-center gap-3 text-4xl font-semibold tracking-tight lg:text-5xl">
            <Grid3X3 className="w-8 h-8 text-signal" />
            Capability Lattice Explorer
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            Every intersection represents a way XCreativs has engaged — or could engage — with a sector.
            Click any cell to see our approach and case precedent.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x py-12">
          {/* Legend */}
          <div className="panel-x mb-8 flex flex-wrap gap-3 p-4">
            {Object.entries(depthConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-gravity/60">{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="panel-x overflow-x-auto p-4">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[180px_repeat(8,1fr)] gap-1">
                <div className="p-2" />
                {capabilities.map((cap) => (
                  <div key={cap} className="p-2 text-[11px] font-medium text-gravity/50 text-center leading-tight">
                    {cap}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {sectors.map((sector) => (
                <div key={sector} className="grid grid-cols-[180px_repeat(8,1fr)] gap-1">
                  <div className="p-2 text-xs font-medium text-gravity/70 flex items-center">{sector}</div>
                  {capabilities.map((cap) => {
                    const inter = getIntersection(sector, cap);
                    const cfg = depthConfig[inter.depth];
                    const isActive = selected?.sector === sector && selected?.capability === cap;
                    return (
                      <button
                        key={cap}
                        onClick={() => setSelected({ sector, capability: cap })}
                        className={`flex h-12 items-center justify-center rounded-xl transition-all ${
                          isActive ? "bg-signal/10 ring-2 ring-signal ring-offset-2 ring-offset-foundation" : "hover:bg-soft"
                        }`}
                        title={`${sector} × ${cap}`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detail panel */}
      {selected && activeIntersection && (
        <section className="border-b border-hairline">
          <div className="shell-x py-12">
            <div className="panel-x relative p-6 lg:p-8">
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1 text-gravity/30 hover:text-gravity transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${depthConfig[activeIntersection.depth].color}`}>
                  {depthConfig[activeIntersection.depth].label}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-2">{selected.sector} × {selected.capability}</h2>
              <p className="mt-4 text-gravity/70 leading-relaxed max-w-3xl">{activeIntersection.approach}</p>
              {activeIntersection.precedent && (
                <div className="mt-6 flex items-center gap-2 text-sm text-signal">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Case precedent:</span>
                  <span>{activeIntersection.precedent}</span>
                </div>
              )}
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="btn-x"
                >
                  Discuss this intersection <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
