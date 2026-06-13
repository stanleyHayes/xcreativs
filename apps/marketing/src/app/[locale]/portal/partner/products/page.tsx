"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Briefcase, Rocket, Calendar, Percent } from "lucide-react";

interface PartnerProduct {
  ID: string | number;
  Name?: string;
  Description?: string;
  Status?: string;
  DevelopmentStage?: string;
  LaunchDate?: string;
  RevenueSharePct?: number;
  IPOwnershipSplit?: string;
}

export default function PartnerProductsPage() {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPartnerProducts()
      .then((d) => { setProducts((d.products as PartnerProduct[] | undefined) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/60">Loading products...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-signal" /> Co-Owned Products</h1>
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.ID} className="border border-white/10 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{p.Name}</h3>
                <p className="text-sm text-white/50 mt-1">{p.Description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${p.Status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-white/50'}`}>{p.Status}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-sm">
              <div className="flex items-center gap-2 text-white/60"><Rocket className="w-3.5 h-3.5" /> {p.DevelopmentStage || "N/A"}</div>
              <div className="flex items-center gap-2 text-white/60"><Calendar className="w-3.5 h-3.5" /> {p.LaunchDate ? new Date(p.LaunchDate).toLocaleDateString() : "TBD"}</div>
              <div className="flex items-center gap-2 text-white/60"><Percent className="w-3.5 h-3.5" /> {p.RevenueSharePct}% rev share</div>
            </div>
            {p.IPOwnershipSplit && (
              <div className="mt-3 text-xs text-white/40 bg-white/5 rounded p-2">
                <span className="font-medium text-white/60">IP Ownership:</span> {p.IPOwnershipSplit}
              </div>
            )}
          </div>
        ))}
        {products.length === 0 && <p className="text-white/40">No products yet.</p>}
      </div>
    </div>
  );
}
