"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Activity, Briefcase, CheckSquare, AlertTriangle, Users, TrendingUp, RefreshCw } from "lucide-react";
import BannerWatermark from "@xc/ui/BannerWatermark";

interface CounterData {
  active_engagements: number;
  deliverables_in_flight: number;
  sectors_covered: number;
  capabilities_deployed: number;
  team_members: number;
  decisions_logged: number;
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function LiveCounterPage() {
  const [data, setData] = useState<CounterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = (await api.getLiveCounter()) as unknown as CounterData;
      setData(res);
      setLastUpdated(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
    const interval = setInterval(() => {
      void fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = data ? [
    { label: "Active Engagements", value: data.active_engagements, icon: Briefcase, color: "text-signal", bg: "bg-signal/10" },
    { label: "Deliverables in Flight", value: data.deliverables_in_flight, icon: CheckSquare, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Sectors Covered", value: data.sectors_covered, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Capabilities Deployed", value: data.capabilities_deployed, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Team Members", value: data.team_members, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Decisions Logged", value: data.decisions_logged, icon: Activity, color: "text-pink-400", bg: "bg-pink-400/10" },
  ] : [];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <BannerWatermark icon={Activity} />
        <div className="shell-x relative py-16 lg:py-20">
          <p className="context-label-x mb-4">Operational telemetry</p>
          <h1 className="font-display flex items-center gap-3 text-4xl font-semibold tracking-tight lg:text-5xl">
            <Activity className="w-8 h-8 text-orange-400" />
            Live Engagement Counter
          </h1>
          <p className="mt-4 max-w-2xl text-gravity/70">
            Real-time operational snapshot of XCreativs client engagements. Numbers refresh every 30 seconds.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Operational Snapshot</h2>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 text-sm text-gravity/50 hover:text-signal transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-x animate-pulse p-6">
                  <div className="h-4 w-20 bg-gravity/10 rounded mb-4" />
                  <div className="h-8 w-16 bg-gravity/10 rounded" />
                </div>
              ))}
            </div>
          ) : data ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="card-x p-6">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter target={card.value} />
                  </p>
                  <p className="text-sm text-gravity/50 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gravity/40 py-12">
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>Failed to load counter data.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
