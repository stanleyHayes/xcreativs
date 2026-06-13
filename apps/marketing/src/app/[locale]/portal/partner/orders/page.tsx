"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { ShoppingCart, Package, DollarSign, Calendar } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";
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

  if (loading) return <div className="text-white/60">Loading orders...</div>;

  const totalValue = orders.reduce((sum, o) => sum + (o.TotalValue || 0), 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.CommissionAmount || 0), 0);
  const fulfilled = orders.filter((o) => o.Status === "fulfilled").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-purple-400" /> Distribution Orders</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Total Orders</p><p className="text-xl font-bold">{orders.length}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Fulfilled</p><p className="text-xl font-bold text-green-400">{fulfilled}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Order Value</p><p className="text-xl font-bold">{format(totalValue)}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Commission</p><p className="text-xl font-bold text-green-400">{format(totalCommission)}</p></div>
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.ID} className="border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded"><Package className="w-4 h-4 text-signal" /></div>
                <div>
                  <p className="font-medium">{o.OrderRef}</p>
                  <p className="text-sm text-white/50">{o.CustomerName}</p>
                  <p className="text-xs text-white/40">{o.CustomerEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${o.Status === 'fulfilled' ? 'bg-green-400/10 text-green-400' : o.Status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-white/5 text-white/50'}`}>{o.Status}</span>
                <p className="text-sm font-medium mt-1">{format(o.TotalValue || 0)}</p>
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
        {orders.length === 0 && <p className="text-white/40">No orders yet.</p>}
      </div>
    </div>
  );
}
