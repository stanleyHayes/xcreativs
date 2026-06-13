"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";

export default function BudgetPage() {
  const { id } = useParams();
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { format } = useCurrency();

  useEffect(() => {
    if (!id) return;
    api.listBudgetLines(id as string).then((d) => { setLines(d.budget_lines || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, [id]);

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  const totalAllocated = lines.reduce((sum, l) => sum + (l.AllocatedUSD || 0), 0);
  const totalSpent = lines.reduce((sum, l) => sum + (l.SpentUSD || 0), 0);
  const remaining = totalAllocated - totalSpent;
  const percent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Budget Tracker</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider">Allocated</p>
          <p className="text-2xl font-bold mt-1">{format(totalAllocated)}</p>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider">Spent</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{format(totalSpent)}</p>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider">Remaining</p>
          <p className="text-2xl font-bold mt-1 text-signal">{format(remaining)}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Burn rate</span>
          <span className="font-medium">{percent}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${percent > 90 ? "bg-red-400" : percent > 70 ? "bg-yellow-400" : "bg-signal"}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((l) => {
          const allocated = l.AllocatedUSD || 0;
          const spent = l.SpentUSD || 0;
          const linePct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
          return (
            <div key={l.ID} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-signal" />
                  <span className="font-medium">{l.Item}</span>
                </div>
                <span className="text-xs text-white/40">{l.Category}</span>
              </div>
              <div className="flex justify-between text-sm text-white/50 mb-2">
                <span>{format(spent)} / {format(allocated)}</span>
                <span>{linePct}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${linePct > 90 ? "bg-red-400" : linePct > 70 ? "bg-yellow-400" : "bg-signal"}`}
                  style={{ width: `${Math.min(linePct, 100)}%` }}
                />
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
