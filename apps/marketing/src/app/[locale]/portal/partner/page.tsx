"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, FileText, Users, ShoppingCart, TrendingUp, ArrowRight, Globe, Percent } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";
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
      .catch((e) => { setError(e.message || "Failed to load partner data"); setLoading(false); });
  }, []);

  if (loading) return <div className="text-white/60">Loading partner dashboard...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!data?.partner) return <div className="text-white/60">No partner association found.</div>;

  const { partner, products, agreements, referrals, orders } = data;
  const convertedReferrals = referrals?.filter((r: ReferralItem) => r.Status === "converted") || [];
  const totalCommission = orders?.reduce((sum: number, o: OrderItem) => sum + (o.CommissionAmount || 0), 0) || 0;
  const totalOrderValue = orders?.reduce((sum: number, o: OrderItem) => sum + (o.TotalValue || 0), 0) || 0;

  const cards = [
    { label: "Products", value: products?.length || 0, icon: Briefcase, href: `/${locale}/portal/partner/products`, color: "text-signal" },
    { label: "Agreements", value: agreements?.length || 0, icon: FileText, href: `/${locale}/portal/partner/agreements`, color: "text-yellow-400" },
    { label: "Referrals", value: referrals?.length || 0, icon: Users, href: `/${locale}/portal/partner/referrals`, color: "text-green-400" },
    { label: "Orders", value: orders?.length || 0, icon: ShoppingCart, href: `/${locale}/portal/partner/orders`, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-signal/10 rounded">
            <Briefcase className="w-5 h-5 text-signal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{partner.OrgName}</h1>
            <p className="text-sm text-white/50 capitalize">{partner.Tier} · {partner.PartnerType?.replace("_", " ")}</p>
          </div>
        </div>
        <p className="text-white/60 mt-2 max-w-2xl">{partner.Description}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/50">
          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {partner.OrgWebsite?.replace("https://", "")}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {partner.ContactName}</span>
          {partner.RevenueSharePct && <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> {partner.RevenueSharePct}% revenue share</span>}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="border border-white/10 rounded-lg p-4 hover:border-signal/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-signal transition-colors" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-white/50">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50 mb-1">Total Order Value</p>
          <p className="text-2xl font-bold">{format(totalOrderValue)}</p>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50 mb-1">Total Commissions</p>
          <p className="text-2xl font-bold text-green-400">{format(totalCommission)}</p>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50 mb-1">Converted Referrals</p>
          <p className="text-2xl font-bold">{convertedReferrals.length}</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="border border-white/10 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-signal" /> Recent Orders</h2>
            <Link href={`/${locale}/portal/partner/orders`} className="text-xs text-signal hover:underline">View all</Link>
          </div>
          {orders?.length === 0 && <p className="text-sm text-white/40">No orders yet.</p>}
          <div className="space-y-3">
            {orders?.slice(0, 3).map((order: OrderItem) => (
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
        <div className="border border-white/10 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Recent Referrals</h2>
            <Link href={`/${locale}/portal/partner/referrals`} className="text-xs text-signal hover:underline">View all</Link>
          </div>
          {referrals?.length === 0 && <p className="text-sm text-white/40">No referrals yet.</p>}
          <div className="space-y-3">
            {referrals?.slice(0, 3).map((ref: ReferralItem) => (
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
