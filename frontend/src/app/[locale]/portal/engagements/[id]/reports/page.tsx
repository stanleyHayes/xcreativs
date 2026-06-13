"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileBarChart, Download, ClipboardCheck, TrendingUp, Shield } from "lucide-react";

interface Report {
  ID?: string;
  Title?: string;
  ReportType?: string;
  RoleScope?: string;
  FileURL?: string;
}

const reportTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  quarterly_review: { icon: <TrendingUp className="w-4 h-4" />, color: "text-signal", label: "Quarterly Review" },
  handover: { icon: <ClipboardCheck className="w-4 h-4" />, color: "text-white/60", label: "Handover" },
  audit: { icon: <Shield className="w-4 h-4" />, color: "text-yellow-400", label: "Audit" },
  status_memo: { icon: <FileBarChart className="w-4 h-4" />, color: "text-green-400", label: "Status Memo" },
  board_pack: { icon: <FileBarChart className="w-4 h-4" />, color: "text-signal", label: "Board Pack" },
};

export default function ReportsPage() {
  const { id } = useParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.listReports(id as string).then((d) => { setReports((d.reports || []) as Report[]); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, [id]);

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Reports Library</h2>
      <p className="text-sm text-white/50 mb-6">Quarterly reviews, status memos, board packs, and technical handovers.</p>

      <div className="space-y-3">
        {reports.map((r) => {
          const config = (r.ReportType ? reportTypeConfig[r.ReportType] : undefined) || { icon: <FileBarChart className="w-4 h-4" />, color: "text-white/40", label: r.ReportType };
          return (
            <div key={r.ID} className="flex items-center gap-4 border border-white/10 rounded-lg p-4 hover:border-signal/50 transition-colors">
              <div className={`p-2 bg-white/5 rounded ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{r.Title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${config.color} bg-white/5`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 capitalize">{r.RoleScope} access</p>
              </div>
              {r.FileURL && (
                <a
                  href={r.FileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-signal hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
