"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileText, Download, Shield, BookOpen, FileCheck } from "lucide-react";

interface PortalDocument {
  ID: string;
  Title: string;
  DocType: string;
  RoleScope: string;
  FileURL?: string;
}

const docTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  contract: { icon: <FileCheck className="w-4 h-4" />, color: "text-signal", label: "Contract" },
  nda: { icon: <Shield className="w-4 h-4" />, color: "text-yellow-400", label: "NDA" },
  runbook: { icon: <BookOpen className="w-4 h-4" />, color: "text-white/60", label: "Runbook" },
  sla: { icon: <FileCheck className="w-4 h-4" />, color: "text-green-400", label: "SLA" },
};

export default function DocumentsPage() {
  const { id } = useParams();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.listDocuments(id as string).then((d) => { setDocuments((d.documents as PortalDocument[] | undefined) || []); setLoading(false); }).catch(() => setError("Failed to load data"));
  }, [id]);

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Document Library</h2>
      <p className="text-sm text-white/50 mb-6">Reference documents, contracts, and agreements.</p>

      <div className="space-y-3">
        {documents.map((doc) => {
          const config = docTypeConfig[doc.DocType] || { icon: <FileText className="w-4 h-4" />, color: "text-white/40", label: doc.DocType };
          return (
            <div key={doc.ID} className="portal-card-x flex items-center gap-4 p-4 transition-colors hover:border-signal/50">
              <div className={`p-2 bg-white/5 rounded ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{doc.Title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${config.color} bg-white/5`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 capitalize">{doc.RoleScope} access</p>
              </div>
              {doc.FileURL && (
                <a
                  href={doc.FileURL}
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
