"use client";

import { useEffect, useState } from "react";
import { Briefcase, FileCheck, Globe, Layers, Users, GitBranch } from "lucide-react";

interface CounterData {
  active_engagements: number;
  deliverables_in_flight: number;
  sectors_covered: number;
  capabilities_deployed: number;
  team_members: number;
  decisions_logged: number;
}

const items = [
  { key: "active_engagements" as const, label: "Active Engagements", icon: Briefcase },
  { key: "deliverables_in_flight" as const, label: "Deliverables in Flight", icon: FileCheck },
  { key: "sectors_covered" as const, label: "Sectors Covered", icon: Globe },
  { key: "capabilities_deployed" as const, label: "Capabilities Deployed", icon: Layers },
  { key: "team_members" as const, label: "Team Members", icon: Users },
  { key: "decisions_logged" as const, label: "Decisions Logged", icon: GitBranch },
];

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

export default function LiveEngagementCounter() {
  const [data, setData] = useState<CounterData | null>(null);

  useEffect(() => {
    fetch(`/api/v1/metrics/engagements`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <section className="relative overflow-hidden bg-[#08090d] py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(91,147,255,0.22),transparent_34rem)]"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_24px_rgba(74,222,128,0.7)]" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">Live Firm Intelligence</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-white/12 bg-white/[0.045] p-4 text-center shadow-[0_22px_70px_-54px_rgba(91,147,255,0.8)]"
            >
              <item.icon className="mx-auto mb-3 h-5 w-5 text-[#78a6ff]" />
              <p className="font-display text-3xl font-semibold tracking-tight text-white">
                <AnimatedNumber value={data[item.key]} />
              </p>
              <p className="mt-1 text-xs leading-tight text-white/58">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
