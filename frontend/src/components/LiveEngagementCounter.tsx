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
    let start = 0;
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/metrics/engagements`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <section className="py-16 bg-gravity text-foundation">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs uppercase tracking-widest text-white/50 font-medium">Live Firm Intelligence</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {items.map((item) => (
            <div key={item.key} className="border border-white/10 rounded-lg p-4 text-center">
              <item.icon className="w-5 h-5 text-signal mx-auto mb-3" />
              <p className="text-3xl font-bold tracking-tight">
                <AnimatedNumber value={data[item.key]} />
              </p>
              <p className="text-xs text-white/50 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
