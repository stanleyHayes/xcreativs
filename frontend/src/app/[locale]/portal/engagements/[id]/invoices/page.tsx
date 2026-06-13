"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Receipt, CheckCircle, Clock, XCircle, Plus, X, Link2 } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";

const statusStyle = (s: string) =>
  s === "paid" ? "bg-signal/10 text-signal" :
  s === "overdue" ? "bg-red-400/10 text-red-400" :
  s === "void" ? "bg-white/5 text-white/40" :
  s === "sent" ? "bg-blue-400/10 text-blue-400" :
  "bg-yellow-400/10 text-yellow-400";

export default function InvoicesPage() {
  const { id } = useParams();
  const { format } = useCurrency();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", currency: "USD", due_date: "" });

  const load = () => {
    if (!id) return;
    api.listInvoices(id as string).then((d) => { setInvoices(d.invoices || []); setLoading(false); }).catch(() => { setError("Failed to load data"); setLoading(false); });
  };
  useEffect(() => { load(); }, [id]);

  async function generate() {
    if (!id || !form.amount) return;
    setBusy("new");
    try {
      await api.generateInvoice(id as string, { amount: Number(form.amount), currency: form.currency, due_date: form.due_date || undefined });
      setShowForm(false); setForm({ amount: "", currency: "USD", due_date: "" });
      load();
    } catch { alert("Failed to generate invoice"); } finally { setBusy(null); }
  }

  async function makeLink(invId: string) {
    setBusy(invId);
    try { await api.generateInvoicePaymentLink(invId, { provider: "paystack" }); load(); }
    catch { alert("Failed to generate payment link"); } finally { setBusy(null); }
  }

  async function markPaid(invId: string) {
    setBusy(invId);
    try { await api.updateInvoiceStatus(invId, { status: "paid" }); load(); }
    catch { alert("Failed to update invoice"); } finally { setBusy(null); }
  }

  if (error) return <div className="text-white/60">{error}</div>;
  if (loading) return <div className="text-white/60">Loading...</div>;

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-signal" />;
    if (s === "overdue" || s === "void") return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 transition">
          <Plus className="w-4 h-4" /> Generate
        </button>
      </div>

      {showForm && (
        <div className="border border-white/10 rounded-lg p-4 mb-6 bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">New Invoice</h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Amount</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal">
                <option value="USD">USD</option><option value="GHS">GHS</option><option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Due date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={generate} disabled={busy === "new" || !form.amount} className="px-3 py-1.5 text-sm bg-signal text-black rounded-md hover:bg-signal/90 disabled:opacity-50">
              {busy === "new" ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-8 text-center">
          <Receipt className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const link = inv.StripePaymentLink || inv.PaystackPaymentLink;
            return (
              <div key={inv.ID} className="flex items-center gap-4 border border-white/10 rounded-lg p-4">
                {statusIcon(inv.Status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inv.InvoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${statusStyle(inv.Status)}`}>{inv.Status}</span>
                  </div>
                  <p className="text-sm text-white/50 mt-0.5">{format(inv.Amount || 0)} {inv.Currency}</p>
                </div>
                {inv.DueDate && <div className="text-xs text-white/40">Due {new Date(inv.DueDate).toLocaleDateString()}</div>}
                <div className="flex items-center gap-2">
                  {!link && inv.Status !== "paid" && (
                    <button onClick={() => makeLink(inv.ID)} disabled={busy === inv.ID} className="text-xs flex items-center gap-1 border border-white/10 px-2.5 py-1.5 rounded hover:bg-white/5 disabled:opacity-50">
                      <Link2 className="w-3.5 h-3.5" /> Payment link
                    </button>
                  )}
                  {link && inv.Status !== "paid" && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs bg-signal text-black px-3 py-1.5 rounded font-medium hover:opacity-90">Pay</a>
                  )}
                  {inv.Status !== "paid" && inv.Status !== "void" && (
                    <button onClick={() => markPaid(inv.ID)} disabled={busy === inv.ID} className="text-xs text-white/50 hover:text-signal disabled:opacity-50">Mark paid</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
