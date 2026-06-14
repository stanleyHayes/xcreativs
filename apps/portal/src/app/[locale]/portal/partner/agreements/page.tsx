"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Calendar, Download, FileCheck2, FileText, Shield, Sparkles } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Agreement {
  ID?: string | number;
  Title?: string;
  SignedAt?: string;
  ExpiresAt?: string;
  DocumentURL?: string;
  Terms?: Record<string, unknown>;
}

export default function PartnerAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPartnerAgreements()
      .then((d) => { setAgreements((d.agreements as Agreement[]) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
        <div className="portal-skeleton-x h-48" />
      </div>
    );
  }

  const signedCount = agreements.filter((a) => Boolean(a.SignedAt)).length;
  const downloadableCount = agreements.filter((a) => Boolean(a.DocumentURL)).length;
  const termsCount = agreements.reduce((sum, a) => sum + (a.Terms ? Object.keys(a.Terms).length : 0), 0);

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <FileText className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Partner contracts</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Partnership agreements
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Signed terms, expiry windows, downloadable documents, and key commercial conditions for the partner relationship.
            </p>
          </div>
          <div className="portal-card-x p-5 lg:w-72">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Signed</p>
                <p className="font-display mt-2 text-4xl font-semibold">{signedCount}</p>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-2 text-sm text-white/48">{downloadableCount} downloadable documents</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Agreements", value: agreements.length, icon: FileText },
          { label: "Signed", value: signedCount, icon: FileCheck2 },
          { label: "Key terms", value: termsCount, icon: Shield },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="portal-card-x portal-stat-x p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="portal-meta-x">{metric.label}</p>
                <Icon className="h-5 w-5 text-signal" />
              </div>
              <p className="font-display text-4xl font-semibold">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="portal-panel-x p-4 sm:p-5">
        <div className="mb-5">
          <p className="portal-meta-x">Contract library</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">Agreement records</h2>
        </div>
        <div className="space-y-4">
          {agreements.map((a) => (
            <div key={a.ID} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="portal-meta-x text-signal">Agreement</p>
                  <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">{a.Title || "Untitled agreement"}</h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-signal" /> Signed {a.SignedAt ? new Date(a.SignedAt).toLocaleDateString() : "Pending"}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-signal" /> Expires {a.ExpiresAt ? new Date(a.ExpiresAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
                {a.DocumentURL && (
                  <a href={a.DocumentURL} target="_blank" rel="noopener noreferrer" className="portal-btn-secondary-x shrink-0">
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
              </div>
              {a.Terms && Object.keys(a.Terms).length > 0 && (
                <div className="mt-5 border-t border-white/8 pt-4">
                  <p className="portal-meta-x flex items-center gap-2 text-white/52"><Shield className="h-3.5 w-3.5 text-signal" /> Key terms</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(a.Terms).map(([key, value]: [string, unknown]) => (
                      <div key={key} className="rounded-lg border border-white/8 bg-white/[0.035] p-3">
                        <p className="portal-meta-x">{key.replace(/_/g, " ")}</p>
                        <p className="mt-1 truncate text-white/80">{Array.isArray(value) ? value.join(", ") : String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {agreements.length === 0 && (
            <PortalEmptyState
              icon={FileCheck2}
              eyebrow="Contract library"
              title="No agreements yet"
              description="Signed partner agreements, downloadable documents, expiry windows, and key terms will appear here once they are attached to the workspace."
            />
          )}
        </div>
      </section>
    </div>
  );
}
