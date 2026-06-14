"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Briefcase, Calendar, PackageSearch, Percent, Rocket, Sparkles } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

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

  const activeProducts = products.filter((p) => p.Status === "active").length;
  const launchDates = products.filter((p) => Boolean(p.LaunchDate)).length;

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <Briefcase className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Partner catalogue</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Co-owned products
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Product rights, revenue share, development stage, and launch readiness for partner-owned catalogue items.
            </p>
          </div>
          <div className="portal-card-x p-5 lg:w-72">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Portfolio</p>
                <p className="font-display mt-2 text-4xl font-semibold">{products.length}</p>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-2 text-sm text-white/48">{activeProducts} active products · {launchDates} dated launches</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Products", value: products.length, icon: PackageSearch },
          { label: "Active", value: activeProducts, icon: Rocket },
          { label: "Launch dates", value: launchDates, icon: Calendar },
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
          <p className="portal-meta-x">Catalogue list</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">Product records</h2>
        </div>
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.ID} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="portal-meta-x text-signal">{p.DevelopmentStage || "Product"}</p>
                  <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight">{p.Name || "Untitled product"}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/52">{p.Description || "No product description has been published yet."}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${p.Status === 'active' ? 'bg-green-400/10 text-green-300' : 'bg-white/5 text-white/50'}`}>
                  {p.Status || "draft"}
                </span>
              </div>
              <div className="mt-5 grid gap-3 border-t border-white/8 pt-4 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2 text-white/60"><Rocket className="h-3.5 w-3.5 text-signal" /> {p.DevelopmentStage || "Stage pending"}</div>
                <div className="flex items-center gap-2 text-white/60"><Calendar className="h-3.5 w-3.5 text-signal" /> {p.LaunchDate ? new Date(p.LaunchDate).toLocaleDateString() : "Launch TBD"}</div>
                <div className="flex items-center gap-2 text-white/60"><Percent className="h-3.5 w-3.5 text-signal" /> {p.RevenueSharePct ? `${p.RevenueSharePct}% rev share` : "Revenue share TBD"}</div>
              </div>
              {p.IPOwnershipSplit && (
                <div className="mt-4 rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm text-white/52">
                  <span className="font-semibold text-white/72">IP ownership:</span> {p.IPOwnershipSplit}
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <PortalEmptyState
              icon={PackageSearch}
              eyebrow="Catalogue"
              title="No products yet"
              description="Co-owned products will appear here once the partner catalogue has been created or linked to this workspace."
            />
          )}
        </div>
      </section>
    </div>
  );
}
