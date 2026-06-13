"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import type { DashboardResponse, Entity } from "@xc/api/types";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Milestone {
  ID?: string;
  Status?: string;
  Title?: string;
  Description?: string;
}

interface Activity {
  ID?: string;
  ActorName?: string;
  Action?: string;
  ResourceType?: string;
  CreatedAt?: string;
}

export default function DashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getDashboard(id as string).then((d) => { setData(d); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, [id]);

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Milestones */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Milestones</h2>
        <div className="space-y-3">
          {data?.milestones?.map((entity: Entity) => {
            const m = entity as Milestone;
            return (
            <div
              key={m.ID}
              className="flex items-center gap-4 border border-white/10 rounded p-4"
            >
              {m.Status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-signal shrink-0" />
              ) : m.Status === "in_progress" ? (
                <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white/30 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{m.Title}</p>
                <p className="text-sm text-white/50">{m.Description}</p>
              </div>
              <span className="text-xs text-white/40 capitalize">{m.Status}</span>
            </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {data?.recent_activity?.map((entity: Entity) => {
            const a = entity as Activity;
            return (
            <div key={a.ID} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-signal mt-1.5 shrink-0" />
              <div>
                <span className="font-medium">{a.ActorName}</span>{" "}
                <span className="text-white/50">{a.Action}</span>{" "}
                <span className="text-white/70">{a.ResourceType}</span>
                <p className="text-xs text-white/30 mt-0.5">
                  {new Date(a.CreatedAt ?? "").toLocaleString()}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
