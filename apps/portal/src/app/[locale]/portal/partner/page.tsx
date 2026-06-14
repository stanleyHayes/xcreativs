"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Briefcase, FileText, Globe, Handshake, Percent, ShoppingCart, Sparkles, TrendingUp, Users } from "lucide-react";
import { useCurrency } from "@xc/ui/CurrencyProvider";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import type { Entity } from "@xc/api/types";

interface PartnerInfo {
  OrgName?: string;
  Tier?: string;
  PartnerType?: string;
  Description?: string;
  OrgWebsite?: string;
  ContactName?: string;
  RevenueSharePct?: number;
}

interface ReferralItem {
  ID?: string;
  Status?: string;
  ReferredOrgName?: string;
  ReferredContactName?: string;
  OpportunityValue?: number;
}

interface OrderItem {
  ID?: string;
  Status?: string;
  OrderRef?: string;
  CustomerName?: string;
  TotalValue?: number;
  CommissionAmount?: number;
}

interface PartnerDashboardData {
  partner?: PartnerInfo;
  products?: Entity[];
  agreements?: Entity[];
  referrals?: ReferralItem[];
  orders?: OrderItem[];
}

export default function PartnerDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { format } = useCurrency();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPartnerDashboard()
      .then((d) => { setData(d as PartnerDashboardData); setLoading(false); })
      .catch((e) => {
        const message = e instanceof Error ? e.message : "Failed to load partner data";
        if (message.includes("no partner association") || message.includes("HTTP 404")) {
          setData({ products: [], agreements: [], referrals: [], orders: [] });
        } else {
          setError(message);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="portal-skeleton-x h-64" />
          <div className="portal-skeleton-x h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PortalEmptyState
        icon={AlertTriangle}
        eyebrow="Partner desk"
        title="Partner data could not load"
        description={error}
      />
    );
  }

  if (!data?.partner) {
    return (
      <PortalEmptyState
        icon={Handshake}
        eyebrow="Partner desk"
        title="No partner workspace yet"
        description="Partner products, agreements, referrals, and orders will appear here when your account is linked to a partner organisation."
      />
    );
  }

  const { partner, products, agreements, referrals, orders } = data;
  const productList = products || [];
  const agreementList = agreements || [];
  const referralList = referrals || [];
  const orderList = orders || [];
  const convertedReferrals = referralList.filter((r: ReferralItem) => r.Status === "converted");
  const totalCommission = orderList.reduce((sum: number, o: OrderItem) => sum + (o.CommissionAmount || 0), 0);
  const totalOrderValue = orderList.reduce((sum: number, o: OrderItem) => sum + (o.TotalValue || 0), 0);

  const cards = [
    { label: "Products", value: productList.length, icon: Briefcase, href: `/${locale}/portal/partner/products`, color: "text-signal", text: "Co-owned catalogue" },
    { label: "Agreements", value: agreementList.length, icon: FileText, href: `/${locale}/portal/partner/agreements`, color: "text-yellow-300", text: "Signed terms" },
    { label: "Referrals", value: referralList.length, icon: Users, href: `/${locale}/portal/partner/referrals`, color: "text-green-300", text: "Pipeline activity" },
    { label: "Orders", value: orderList.length, icon: ShoppingCart, href: `/${locale}/portal/partner/orders`, color: "text-purple-300", text: "Distribution sales" },
  ];

  return (
    <div className="space-y-8">
      <section className="portal-admin-header-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <Handshake className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Partner workspace</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              {partner.OrgName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/58 sm:text-base">
              {partner.Description || "Manage partner agreements, products, referrals, orders, and commission visibility in one secure workspace."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {partner.Tier && <span className="portal-chip-x capitalize">{partner.Tier} tier</span>}
              {partner.PartnerType && <span className="portal-chip-x capitalize">{partner.PartnerType.replace("_", " ")}</span>}
              {partner.RevenueSharePct && <span className="portal-chip-x">{partner.RevenueSharePct}% revenue share</span>}
            </div>
          </div>

          <div className="portal-card-x p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Commercial pulse</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">{format(totalCommission)}</h2>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-2 text-sm text-white/48">Total commission tracked across partner orders.</p>
            <div className="mt-5 space-y-2 text-sm text-white/52">
              {partner.OrgWebsite && (
                <p className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-signal" />
                  {partner.OrgWebsite.replace("https://", "")}
                </p>
              )}
              {partner.ContactName && (
                <p className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-signal" />
                  {partner.ContactName}
                </p>
              )}
              {partner.RevenueSharePct && (
                <p className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-signal" />
                  {partner.RevenueSharePct}% revenue share
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="portal-card-x portal-stat-x group p-5 transition-colors hover:border-signal/30">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-signal transition-colors" />
            </div>
            <div>
              <p className="font-display text-4xl font-semibold tracking-tight">{card.value}</p>
              <p className="text-sm font-medium text-white/72">{card.label}</p>
              <p className="mt-1 text-xs text-white/42">{card.text}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="portal-card-x p-4">
          <p className="text-sm text-white/50 mb-1">Total Order Value</p>
          <p className="font-display text-3xl font-semibold tracking-tight">{format(totalOrderValue)}</p>
        </div>
        <div className="portal-card-x p-4">
          <p className="text-sm text-white/50 mb-1">Total Commissions</p>
          <p className="font-display text-3xl font-semibold tracking-tight text-green-400">{format(totalCommission)}</p>
        </div>
        <div className="portal-card-x p-4">
          <p className="text-sm text-white/50 mb-1">Converted Referrals</p>
          <p className="font-display text-3xl font-semibold tracking-tight">{convertedReferrals.length}</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="portal-card-x p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-signal" /> Recent Orders</h2>
            <Link href={`/${locale}/portal/partner/orders`} className="text-xs text-signal hover:underline">View all</Link>
          </div>
          {orderList.length === 0 && (
            <PortalEmptyState
              compact
              icon={ShoppingCart}
              title="No orders yet"
              description="Distribution orders and commission movement will appear here once customers begin purchasing through the partner channel."
            />
          )}
          <div className="space-y-3">
            {orderList.slice(0, 3).map((order: OrderItem) => (
              <div key={order.ID} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{order.OrderRef}</p>
                  <p className="text-xs text-white/50">{order.CustomerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{format(order.TotalValue || 0)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase ${order.Status === 'fulfilled' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{order.Status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent referrals */}
        <div className="portal-card-x p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Recent Referrals</h2>
            <Link href={`/${locale}/portal/partner/referrals`} className="text-xs text-signal hover:underline">View all</Link>
          </div>
          {referralList.length === 0 && (
            <PortalEmptyState
              compact
              icon={TrendingUp}
              title="No referrals yet"
              description="Qualified opportunities, conversion status, and potential commission will appear here as referrals are submitted."
            />
          )}
          <div className="space-y-3">
            {referralList.slice(0, 3).map((ref: ReferralItem) => (
              <div key={ref.ID} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{ref.ReferredOrgName}</p>
                  <p className="text-xs text-white/50">{ref.ReferredContactName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{format(ref.OpportunityValue || 0)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase ${ref.Status === 'converted' ? 'bg-green-400/10 text-green-400' : ref.Status === 'qualified' ? 'bg-signal/10 text-signal' : 'bg-white/5 text-white/50'}`}>{ref.Status?.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
