"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, Download, Calendar, Shield } from "lucide-react";

export default function PartnerAgreementsPage() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPartnerAgreements()
      .then((d) => { setAgreements(d.agreements || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/60">Loading agreements...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-yellow-400" /> Partnership Agreements</h1>
      <div className="space-y-4">
        {agreements.map((a) => (
          <div key={a.ID} className="border border-white/10 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{a.Title}</h3>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/50">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Signed {a.SignedAt ? new Date(a.SignedAt).toLocaleDateString() : "Pending"}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expires {a.ExpiresAt ? new Date(a.ExpiresAt).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
              {a.DocumentURL && (
                <a href={a.DocumentURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-signal hover:underline border border-signal/20 px-3 py-1.5 rounded">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
            </div>
            {a.Terms && Object.keys(a.Terms).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs font-medium text-white/60 mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> Key Terms</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {Object.entries(a.Terms).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white/5 rounded p-2">
                      <p className="text-xs text-white/40 uppercase">{key.replace(/_/g, " ")}</p>
                      <p className="text-white/80 truncate">{Array.isArray(value) ? value.join(", ") : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {agreements.length === 0 && <p className="text-white/40">No agreements yet.</p>}
      </div>
    </div>
  );
}
