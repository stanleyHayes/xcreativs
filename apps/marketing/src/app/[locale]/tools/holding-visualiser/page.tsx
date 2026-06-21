"use client";

import { useState } from "react";
import { Network, ArrowRight, Building2, FlaskConical, Briefcase, Users, Landmark, Cpu, Globe, ArrowUpRight } from "lucide-react";
import BannerWatermark from "@xc/ui/BannerWatermark";

interface Node {
  id: string;
  label: string;
  type: "parent" | "arm" | "unit" | "product";
  description: string;
  icon: React.ReactNode;
  children?: string[];
  details?: string[];
  link?: string;
}

const nodes: Record<string, Node> = {
  parent: {
    id: "parent",
    label: "XCreativs Technologies",
    type: "parent",
    description: "Intelligent digital systems holding company. Services, Labs, and Subsidiaries — each with distinct mandates and shared infrastructure.",
    icon: <Building2 className="w-6 h-6" />,
    children: ["services", "labs", "subsidiaries"],
    details: ["Founded by Shayford D. D. K. Darteh", "15+ platforms shipped", "2 flagship mandates active", "Headquarters: Accra, Ghana"],
  },
  services: {
    id: "services",
    label: "Services",
    type: "arm",
    description: "Client-facing engagements. Governments and enterprises contract XCreativs to build, audit, and transform their digital infrastructure.",
    icon: <Briefcase className="w-5 h-5" />,
    children: ["audit", "enterprise", "ai", "digital", "advisory"],
    link: "/services",
  },
  labs: {
    id: "labs",
    label: "XCreativs Labs",
    type: "arm",
    description: "Product arm. Builds intelligent digital systems that solve national-scale problems, then spins them out into subsidiary companies.",
    icon: <FlaskConical className="w-5 h-5" />,
    children: ["ilivvon", "24h-aia"],
    link: "/labs",
  },
  subsidiaries: {
    id: "subsidiaries",
    label: "Subsidiaries",
    type: "arm",
    description: "Spun-out product companies that operate independently with XCreativs retaining equity and strategic oversight.",
    icon: <Landmark className="w-5 h-5" />,
    children: ["ilivvon-subsidiary"],
    link: "/subsidiaries",
  },
  audit: {
    id: "audit",
    label: "Digital Systems Audit",
    type: "unit",
    description: "Comprehensive evaluation of existing digital infrastructure, producing architecture blueprints and 18-36 month roadmaps.",
    icon: <Cpu className="w-4 h-4" />,
    link: "/services/audit",
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise Development",
    type: "unit",
    description: "Custom, sovereign-by-default platforms for national-scale mandates. Government and enterprise grade.",
    icon: <Building2 className="w-4 h-4" />,
    link: "/services/enterprise",
  },
  ai: {
    id: "ai",
    label: "AI & Automation",
    type: "unit",
    description: "Intelligence layers, predictive systems, workflow automation, and machine learning pipelines.",
    icon: <Cpu className="w-4 h-4" />,
    link: "/services/ai",
  },
  digital: {
    id: "digital",
    label: "Strategic Platforms",
    type: "unit",
    description: "High-performance public surfaces with integrated lead qualification, analytics, and continuous deployment.",
    icon: <Globe className="w-4 h-4" />,
    link: "/services/digital",
  },
  advisory: {
    id: "advisory",
    label: "Strategy & Advisory",
    type: "unit",
    description: "Operating design, governance frameworks, digital transformation roadmaps, and board-level advisory.",
    icon: <Users className="w-4 h-4" />,
    link: "/services/advisory",
  },
  ilivvon: {
    id: "ilivvon",
    label: "ILIVVON",
    type: "product",
    description: "Health intelligence platform for Fastcare Clinics. EHR integration, donor intelligence, predictive analytics, and national health interoperability.",
    icon: <FlaskConical className="w-4 h-4" />,
    link: "/labs/ilivvon",
  },
  "24h-aia": {
    id: "24h-aia",
    label: "24H+ AIA",
    type: "product",
    description: "Authority Intelligence Architecture for the 24-Hour Economy Authority of Ghana. National-scale digital systems for economic transformation.",
    icon: <Landmark className="w-4 h-4" />,
    link: "/labs",
  },
  "ilivvon-subsidiary": {
    id: "ilivvon-subsidiary",
    label: "ILIVVON (Spun Out)",
    type: "product",
    description: "Planned subsidiary spin-out for ILIVVON into an independent health technology company with regional expansion.",
    icon: <FlaskConical className="w-4 h-4" />,
  },
};

export default function HoldingVisualiserPage() {
  const [activeNode, setActiveNode] = useState<string>("parent");
  const node = nodes[activeNode];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={Network} />
        <div className="shell-x relative py-16 lg:py-20">
          <p className="context-label-x mb-4">Holding company structure</p>
          <h1 className="font-display flex items-center gap-3 text-4xl font-semibold tracking-tight lg:text-5xl">
            <Network className="w-8 h-8 text-blue-400" />
            Holding Company Visualiser
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            The Services → Labs → Subsidiaries value loop. Click any node to explore how XCreativs is organised, 
            what each arm produces, and how value flows from engagement to product to independent company.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tree */}
            <div className="lg:col-span-2">
              <div className="panel-x p-6">
                {/* Parent */}
                <button
                  onClick={() => setActiveNode("parent")}
                  className={`w-full flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                    activeNode === "parent" ? "border-signal bg-signal/10" : "border-hairline hover:border-signal/40"
                  }`}
                >
                  <div className="p-2 bg-gravity text-foundation rounded">{nodes.parent.icon}</div>
                  <div className="text-left">
                    <p className="font-semibold">{nodes.parent.label}</p>
                    <p className="text-xs text-gravity/50">Parent Holding Company</p>
                  </div>
                </button>

                {/* Arms */}
                <div className="flex justify-around mt-4 mb-2">
                  {nodes.parent.children?.map((childId) => {
                    const child = nodes[childId];
                    return (
                      <button
                        key={childId}
                        onClick={() => setActiveNode(childId)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors ${
                          activeNode === childId ? "border-signal bg-signal/10" : "border-hairline hover:border-signal/40"
                        }`}
                      >
                        <div className={`p-2 rounded ${activeNode === childId ? "bg-signal/20 text-signal" : "bg-soft text-gravity/60"}`}>
                          {child.icon}
                        </div>
                        <span className="text-xs font-medium">{child.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Units under each arm */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {["services", "labs", "subsidiaries"].map((armId) => (
                    <div key={armId} className="space-y-2">
                      {nodes[armId].children?.map((unitId) => {
                        const unit = nodes[unitId];
                        return (
                          <button
                            key={unitId}
                            onClick={() => setActiveNode(unitId)}
                            className={`w-full flex items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
                              activeNode === unitId ? "border-signal bg-signal/10" : "border-hairline hover:border-signal/40"
                            }`}
                          >
                            <span className={activeNode === unitId ? "text-signal" : "text-gravity/40"}>{unit.icon}</span>
                            <span className="text-xs font-medium">{unit.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Value flow */}
              <div className="panel-x mt-6 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-signal" /> Value Flow</h3>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center flex-1">
                    <div className="p-3 bg-blue-400/10 rounded-lg mb-2">
                      <Briefcase className="w-5 h-5 text-blue-500 mx-auto" />
                    </div>
                    <p className="font-medium">Client Revenue</p>
                    <p className="text-xs text-gravity/50">Funds operations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gravity/20 mx-2" />
                  <div className="text-center flex-1">
                    <div className="p-3 bg-purple-400/10 rounded-lg mb-2">
                      <FlaskConical className="w-5 h-5 text-purple-500 mx-auto" />
                    </div>
                    <p className="font-medium">IP Creation</p>
                    <p className="text-xs text-gravity/50">Labs builds products</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gravity/20 mx-2" />
                  <div className="text-center flex-1">
                    <div className="p-3 bg-green-400/10 rounded-lg mb-2">
                      <Landmark className="w-5 h-5 text-green-500 mx-auto" />
                    </div>
                    <p className="font-medium">Subsidiary Spin-out</p>
                    <p className="text-xs text-gravity/50">Independent company</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              <div className="panel-x sticky top-24 p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${activeNode === "parent" ? "bg-gravity text-foundation" : "bg-signal/10 text-signal"}`}>
                  {node.icon}
                </div>
                <h2 className="text-xl font-bold">{node.label}</h2>
                <p className="text-sm text-gravity/60 mt-2 leading-relaxed">{node.description}</p>

                {node.details && (
                  <ul className="mt-4 space-y-2">
                    {node.details.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-gravity/70">
                        <ArrowRight className="w-3.5 h-3.5 text-signal shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}

                {node.link && (
                  <a
                    href={node.link}
                    className="btn-x mt-6"
                  >
                    Explore {node.label} <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
