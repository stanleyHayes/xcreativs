"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Plus, X, CheckCircle, Clock, XCircle, Calendar, DollarSign } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  submitted: { color: "text-white/60", bg: "bg-white/5", icon: <Clock className="w-3.5 h-3.5" /> },
  contacted: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <Clock className="w-3.5 h-3.5" /> },
  qualified: { color: "text-signal", bg: "bg-signal/10", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  converted: { color: "text-green-400", bg: "bg-green-400/10", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed_lost: { color: "text-red-400", bg: "bg-red-400/10", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referred_org_name: "", referred_contact_name: "", referred_contact_email: "", referred_contact_phone: "", opportunity_value: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const { format } = useCurrency();

  const load = () => {
    api.getPartnerReferrals()
      .then((d) => { setReferrals(d.referrals || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      ...form,
      opportunity_value: form.opportunity_value ? parseFloat(form.opportunity_value) : null,
    };
    try {
      await api.createPartnerReferral(data);
      setShowForm(false);
      setForm({ referred_org_name: "", referred_contact_name: "", referred_contact_email: "", referred_contact_phone: "", opportunity_value: "", notes: "" });
      load();
    } catch (e) {
      alert("Failed to submit referral");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-white/60">Loading referrals...</div>;

  const totalPotential = referrals.reduce((sum, r) => sum + (r.OpportunityValue || 0), 0);
  const totalEarned = referrals.reduce((sum, r) => sum + (r.CommissionAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-green-400" /> Referrals</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm bg-signal text-white px-3 py-1.5 rounded hover:bg-signal/90">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? "Cancel" : "New Referral"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Total Referrals</p><p className="text-xl font-bold">{referrals.length}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Converted</p><p className="text-xl font-bold text-green-400">{referrals.filter((r) => r.Status === "converted").length}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Potential Value</p><p className="text-xl font-bold">{format(totalPotential)}</p></div>
        <div className="border border-white/10 rounded-lg p-4"><p className="text-xs text-white/50">Commission Earned</p><p className="text-xl font-bold text-green-400">{format(totalEarned)}</p></div>
      </div>

      {/* New referral form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-white/10 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold">Submit New Referral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Organisation Name *" value={form.referred_org_name} onChange={(e) => setForm({ ...form, referred_org_name: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input placeholder="Contact Name" value={form.referred_contact_name} onChange={(e) => setForm({ ...form, referred_contact_name: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input placeholder="Contact Email" value={form.referred_contact_email} onChange={(e) => setForm({ ...form, referred_contact_email: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input placeholder="Contact Phone" value={form.referred_contact_phone} onChange={(e) => setForm({ ...form, referred_contact_phone: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
            <input type="number" placeholder="Opportunity Value" value={form.opportunity_value} onChange={(e) => setForm({ ...form, opportunity_value: e.target.value })} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-signal h-20" />
          <button type="submit" disabled={submitting} className="bg-signal text-white text-sm px-4 py-2 rounded hover:bg-signal/90 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Referral"}</button>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {referrals.map((r) => {
          const cfg = statusConfig[r.Status] || statusConfig.submitted;
          return (
            <div key={r.ID} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{r.ReferredOrgName}</h3>
                  <p className="text-sm text-white/50">{r.ReferredContactName} {r.ReferredContactEmail && `· ${r.ReferredContactEmail}`}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded uppercase font-medium ${cfg.color} ${cfg.bg}`}>{cfg.icon} {r.Status?.replace("_", " ")}</span>
                  {r.OpportunityValue && <p className="text-sm font-medium mt-1">{format(r.OpportunityValue)}</p>}
                </div>
              </div>
              {r.Notes && <p className="text-xs text-white/40 mt-2 bg-white/5 rounded p-2">{r.Notes}</p>}
              {r.ConvertedAt && (
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Converted {new Date(r.ConvertedAt).toLocaleDateString()}</span>
                  {r.CommissionAmount && <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" /> {format(r.CommissionAmount)}</span>}
                </div>
              )}
            </div>
          );
        })}
        {referrals.length === 0 && <p className="text-white/40">No referrals yet. Submit your first referral above.</p>}
      </div>
    </div>
  );
}
