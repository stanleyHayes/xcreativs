"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Calendar, DollarSign, Package, ReceiptText, ShoppingCart, Sparkles } from "lucide-react";
import { useCurrency } from "@xc/ui/CurrencyProvider";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import type { OrdersResponse } from "@xc/api/types";

interface PartnerOrder {
  ID?: string | number;
  OrderRef?: string;
  CustomerName?: string;
  CustomerEmail?: string;
  Status?: string;
  TotalValue?: number;
  CommissionAmount?: number;
  Quantity?: number;
  UnitPrice?: number;
  CreatedAt?: string;
}

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    api.getPartnerOrders()
      .then((d) => {
        const data = d as OrdersResponse;
        setOrders((data.orders as PartnerOrder[]) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="portal-skeleton-x h-28" />)}
        </div>
      </div>
    );
  }

  const totalValue = orders.reduce((sum, o) => sum + (o.TotalValue || 0), 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.CommissionAmount || 0), 0);
  const fulfilled = orders.filter((o) => o.Status === "fulfilled").length;

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Partner revenue</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Distribution orders
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Review order value, fulfilment status, customer details, and commission generated through partner distribution.
            </p>
          </div>
          <div className="portal-card-x p-5 lg:w-72">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-meta-x">Commission</p>
                <p className="font-display mt-2 text-4xl font-semibold text-green-300">{format(totalCommission)}</p>
              </div>
              <Sparkles className="h-5 w-5 text-signal" />
            </div>
            <p className="mt-2 text-sm text-white/48">{fulfilled} fulfilled orders</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Total orders</p><p className="font-display text-3xl font-semibold">{orders.length}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Fulfilled</p><p className="font-display text-3xl font-semibold text-green-300">{fulfilled}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Order value</p><p className="font-display text-3xl font-semibold">{format(totalValue)}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Commission</p><p className="font-display text-3xl font-semibold text-green-300">{format(totalCommission)}</p></div>
      </div>

      <section className="portal-panel-x p-4 sm:p-5">
        <div className="mb-5">
          <p className="portal-meta-x">Order ledger</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">Distribution activity</h2>
        </div>
        <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.ID} className="portal-card-x p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3"><Package className="h-5 w-5 text-signal" /></div>
                <div>
                  <p className="portal-meta-x">Order</p>
                  <p className="font-display mt-1 text-xl font-semibold">{o.OrderRef || "Unreferenced order"}</p>
                  <p className="text-sm text-white/50">{o.CustomerName}</p>
                  <p className="text-xs text-white/40">{o.CustomerEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${o.Status === 'fulfilled' ? 'bg-green-400/10 text-green-300' : o.Status === 'pending' ? 'bg-yellow-400/10 text-yellow-300' : 'bg-white/5 text-white/50'}`}>{o.Status || "pending"}</span>
                <p className="font-display mt-2 text-2xl font-semibold">{format(o.TotalValue || 0)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/50">
              <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Qty: {o.Quantity}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Unit: {format(o.UnitPrice || 0)}</span>
              <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" /> Commission: {format(o.CommissionAmount || 0)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {o.CreatedAt ? new Date(o.CreatedAt).toLocaleDateString() : "—"}</span>
            </div>
          </div>
        ))}
          {orders.length === 0 && (
            <PortalEmptyState
              icon={ReceiptText}
              eyebrow="Order ledger"
              title="No orders yet"
              description="Partner distribution orders will appear here with fulfilment state, customer detail, order value, and commission once activity begins."
            />
          )}
        </div>
      </section>
    </div>
  );
}
