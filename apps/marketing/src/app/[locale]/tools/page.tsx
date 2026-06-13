import Link from "next/link";
import type { Metadata } from "next";
import { Grid3X3, FileSearch, BarChart3, Network, TrendingUp, DollarSign, Activity, Brain, Wrench } from "lucide-react";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "Tools — XCreativs Technologies",
  description:
    "Public-facing utilities built from XCreativs domain expertise. Capability lattice, cost calculator, readiness assessment, AI maturity score, and more.",
};

const tools = [
  {
    slug: "capability-lattice",
    title: "Capability Lattice Explorer",
    desc: "Interactive grid mapping all firm capabilities against every sector served. Click any intersection to see our approach.",
    icon: Grid3X3,
    color: "text-signal",
    bg: "bg-signal/10",
    available: true,
  },
  {
    slug: "cost-calculator",
    title: "Engagement Cost Calculator",
    desc: "Indicative pricing for common scopes. Toggles for complexity, urgency, team size, and sovereignty constraints.",
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-400/10",
    available: true,
  },
  {
    slug: "readiness-assessment",
    title: "Digital Systems Readiness Assessment",
    desc: "Fifteen questions on your current digital posture. Score across five dimensions with recommended next steps.",
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    available: true,
  },
  {
    slug: "ai-maturity-score",
    title: "AI Maturity Score",
    desc: "Evaluate your organisation readiness for AI adoption across strategy, data, talent, and governance.",
    icon: Brain,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    available: true,
  },
  {
    slug: "tech-debt-estimator",
    title: "Tech Debt Estimator",
    desc: "Inputs: system age, technologies, integration count, change frequency. Output: indicative debt rating.",
    icon: Activity,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    available: true,
  },
  {
    slug: "holding-visualiser",
    title: "Holding Company Visualiser",
    desc: "Interactive map of Parent → Services / Labs / Subsidiaries. Click any node to drill into details.",
    icon: Network,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    available: true,
  },
  {
    slug: "document-intelligence",
    title: "Document Intelligence Demo",
    desc: "Paste contract or policy text. Returns structured extraction: entities, dates, obligations, summary.",
    icon: FileSearch,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    available: true,
  },
  {
    slug: "live-counter",
    title: "Live Engagement Counter",
    desc: "Real-time operational snapshot of active engagements, deliverables, decisions, and risks.",
    icon: Activity,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    available: true,
  },
];

export default function ToolsPage() {
  return (
    <>
      <PageBanner
        icon={Wrench}
        eyebrow="Interactive tools"
        title="Tools that demonstrate capability"
        description="Public-facing utilities built from XCreativs domain expertise. None depend on client data. Each tool is itself a signal of how we think about systems."
        crumbs={[{ label: "Home", href: "/" }, { label: "Tools that demonstrate capability" }]}
      />
      <main>
        <section className="border-b border-hairline bg-soft">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <div key={tool.slug} className={`group card-x p-6 ${tool.available ? "cursor-pointer" : "opacity-60"}`}>
                {tool.available ? (
                  <Link href={`/tools/${tool.slug}`} className="block">
                    <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center mb-4`}>
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <h3 className="font-semibold group-hover:text-signal transition-colors">{tool.title}</h3>
                    <p className="text-sm text-gravity/60 mt-2">{tool.desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-signal mt-4 font-medium">Explore <TrendingUp className="w-3 h-3" /></span>
                  </Link>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center mb-4`}>
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <h3 className="font-semibold">{tool.title}</h3>
                    <p className="text-sm text-gravity/60 mt-2">{tool.desc}</p>
                    <span className="inline-block text-xs text-gravity/30 mt-4 px-2 py-1 rounded bg-gravity/5">Coming soon</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        </section>
      </main>
    </>
  );
}
