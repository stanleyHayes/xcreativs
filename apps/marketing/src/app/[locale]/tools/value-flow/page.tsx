"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Loader2, RefreshCw } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

interface FlowNode {
  id: string;
  label: string;
  metric: number;
  metric_label: string;
  stage: number;
}
interface Flow {
  from: string;
  to: string;
  label: string;
}
interface ValueFlowData {
  nodes: FlowNode[];
  flows: Flow[];
  totals: { deliverables_shipped: number; decisions_logged: number };
}

// Fixed compass positions for the four value-loop nodes (SVG viewBox 0 0 600 600).
const POS: Record<string, { x: number; y: number }> = {
  clients: { x: 300, y: 95 },
  services: { x: 505, y: 300 },
  labs: { x: 300, y: 505 },
  subsidiaries: { x: 95, y: 300 },
};

// Quadratic control points so each edge bulges outward into a rounded loop.
const CTRL: Record<string, { x: number; y: number }> = {
  "clients->services": { x: 478, y: 122 },
  "services->labs": { x: 478, y: 478 },
  "labs->subsidiaries": { x: 122, y: 478 },
  "subsidiaries->clients": { x: 122, y: 122 },
};

function edgePath(from: string, to: string): string {
  const a = POS[from];
  const b = POS[to];
  const c = CTRL[`${from}->${to}`] ?? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
}

export default function ValueFlowPage() {
  const [data, setData] = useState<ValueFlowData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFlow = useCallback((signal?: { active: boolean }) => {
    fetch("/api/v1/visualizations/value-flow")
      .then((r) => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((d: ValueFlowData) => {
        if (!signal || signal.active) setData(d);
      })
      .catch(() => {
        if (!signal || signal.active) setError(true);
      })
      .finally(() => {
        if (!signal || signal.active) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const signal = { active: true };
    fetchFlow(signal);
    return () => {
      signal.active = false;
    };
  }, [fetchFlow]);

  // Retry / refresh from a user gesture — synchronous reset is fine here (not an effect).
  const load = () => {
    setLoading(true);
    setError(false);
    fetchFlow();
  };

  return (
    <>
      <PageBanner
        icon={TrendingUp}
        eyebrow="Interactive tools"
        title="Value Flow"
        description="How XCreativs compounds: client revenue funds operations, operations reinvest into Labs IP, Labs spins out subsidiaries, and subsidiaries extend reach back to clients. Live figures, drawn from the platform."
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Value Flow" },
        ]}
      />

      <main>
        <section className="border-b border-hairline bg-soft">
          <div className="shell-x py-16">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-24 text-gravity/50">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading live figures…
              </div>
            )}

            {error && (
              <div className="card-x mx-auto max-w-md p-8 text-center">
                <p className="text-gravity/70">Couldn&apos;t load the value flow right now.</p>
                <button
                  onClick={load}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-signal/90"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            )}

            {data && !loading && (
              <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                {/* The animated loop */}
                <div className="relative mx-auto w-full max-w-[560px] text-gravity">
                  <svg viewBox="0 0 600 600" className="h-auto w-full" role="img" aria-label="Value flow loop">
                    <defs>
                      <marker
                        id="vf-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="7"
                        markerHeight="7"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0066CC" />
                      </marker>
                    </defs>

                    {/* Flow edges + travelling particles */}
                    {data.flows.map((f, i) => {
                      const d = edgePath(f.from, f.to);
                      const ctrl = CTRL[`${f.from}->${f.to}`];
                      return (
                        <g key={`${f.from}-${f.to}`}>
                          <path id={`vf-path-${i}`} d={d} fill="none" stroke="#0066CC" strokeOpacity={0.28} strokeWidth={2.5} markerEnd="url(#vf-arrow)" />
                          <circle r={5} fill="#0066CC">
                            <animateMotion dur="3.2s" begin={`${i * 0.8}s`} repeatCount="indefinite" rotate="auto">
                              <mpath href={`#vf-path-${i}`} />
                            </animateMotion>
                          </circle>
                          {ctrl && (
                            <text
                              x={ctrl.x}
                              y={ctrl.y}
                              textAnchor="middle"
                              className="fill-current"
                              fillOpacity={0.45}
                              fontSize={12.5}
                              fontStyle="italic"
                            >
                              {f.label}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {data.nodes
                      .filter((n) => POS[n.id])
                      .map((n) => {
                        const p = POS[n.id];
                        return (
                          <g key={n.id} transform={`translate(${p.x - 78} ${p.y - 40})`}>
                            <rect width={156} height={80} rx={16} fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.14} />
                            <text x={78} y={26} textAnchor="middle" className="fill-current" fontSize={13} fontWeight={600}>
                              {n.label}
                            </text>
                            <text x={78} y={52} textAnchor="middle" fill="#0066CC" fontSize={22} fontWeight={700}>
                              {n.metric}
                            </text>
                            <text x={78} y={68} textAnchor="middle" className="fill-current" fillOpacity={0.5} fontSize={10.5}>
                              {n.metric_label}
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                </div>

                {/* Narrative + totals */}
                <div>
                  <ol className="space-y-4">
                    {data.flows.map((f, i) => (
                      <li key={`${f.from}-${f.to}`} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/10 text-xs font-semibold text-signal">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gravity/70">
                          <span className="font-medium capitalize text-gravity">{f.from}</span> → {f.label} →{" "}
                          <span className="font-medium capitalize text-gravity">{f.to}</span>
                        </p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="card-x p-5">
                      <p className="font-display text-2xl font-semibold tracking-tight text-signal">
                        {data.totals.deliverables_shipped}
                      </p>
                      <p className="mt-1 text-xs text-gravity/55">deliverables shipped</p>
                    </div>
                    <div className="card-x p-5">
                      <p className="font-display text-2xl font-semibold tracking-tight text-signal">
                        {data.totals.decisions_logged}
                      </p>
                      <p className="mt-1 text-xs text-gravity/55">decisions logged</p>
                    </div>
                  </div>

                  <button
                    onClick={load}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gravity/60 transition-colors hover:text-signal"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh live figures
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
