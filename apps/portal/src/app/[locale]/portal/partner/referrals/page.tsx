"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import { Calendar, CheckCircle, Clock, DollarSign, Plus, Sparkles, Users, X, XCircle } from "lucide-react";
import { useCurrency } from "@xc/ui/CurrencyProvider";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

interface Referral {
  ID?: string | number;
  Status?: string;
  ReferredOrgName?: string;
  ReferredContactName?: string;
  ReferredContactEmail?: string;
  OpportunityValue?: number;
  CommissionAmount?: number;
  Notes?: string;
  ConvertedAt?: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  submitted: { color: "text-white/60", bg: "bg-white/5", icon: <Clock className="w-3.5 h-3.5" /> },
  contacted: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <Clock className="w-3.5 h-3.5" /> },
  qualified: { color: "text-signal", bg: "bg-signal/10", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  converted: { color: "text-green-400", bg: "bg-green-400/10", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed_lost: { color: "text-red-400", bg: "bg-red-400/10", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referred_org_name: "", referred_contact_name: "", referred_contact_email: "", referred_contact_phone: "", opportunity_value: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const { format } = useCurrency();

  const load = useCallback(() => {
    api.getPartnerReferrals()
      .then((d) => { setReferrals((d.referrals as Referral[]) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
    } catch {
      alert("Failed to submit referral");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-44" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="portal-skeleton-x h-24" />)}
        </div>
        <div className="portal-skeleton-x h-48" />
      </div>
    );
  }

  const totalPotential = referrals.reduce((sum, r) => sum + (r.OpportunityValue || 0), 0);
  const totalEarned = referrals.reduce((sum, r) => sum + (r.CommissionAmount || 0), 0);

  return (
    <div className="space-y-7">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="portal-admin-icon-x">
                <Users className="h-5 w-5" />
              </span>
              <p className="portal-meta-x text-signal">Partner pipeline</p>
            </div>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
              Referrals
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/58 sm:text-base">
              Submit opportunities, track qualification movement, and watch partner commission convert from referred demand.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <div className="portal-card-x p-5 lg:w-72">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="portal-meta-x">Potential value</p>
                  <p className="font-display mt-2 text-4xl font-semibold">{format(totalPotential)}</p>
                </div>
                <Sparkles className="h-5 w-5 text-signal" />
              </div>
              <p className="mt-2 text-sm text-white/48">{referrals.length} referrals tracked</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className={showForm ? "portal-btn-secondary-x" : "portal-btn-x"}>
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? "Close form" : "New referral"}
            </button>
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Total referrals</p><p className="font-display text-3xl font-semibold">{referrals.length}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Converted</p><p className="font-display text-3xl font-semibold text-green-300">{referrals.filter((r) => r.Status === "converted").length}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Potential value</p><p className="font-display text-3xl font-semibold">{format(totalPotential)}</p></div>
        <div className="portal-card-x portal-stat-x p-5"><p className="portal-meta-x">Commission earned</p><p className="font-display text-3xl font-semibold text-green-300">{format(totalEarned)}</p></div>
      </div>

      {/* New referral form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="portal-panel-x space-y-5 p-5 sm:p-6">
          <div>
            <p className="portal-meta-x">New opportunity</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">Submit referral</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Organisation Name *" value={form.referred_org_name} onChange={(e) => setForm({ ...form, referred_org_name: e.target.value })} className="portal-field-x" />
            <input placeholder="Contact Name" value={form.referred_contact_name} onChange={(e) => setForm({ ...form, referred_contact_name: e.target.value })} className="portal-field-x" />
            <input placeholder="Contact Email" value={form.referred_contact_email} onChange={(e) => setForm({ ...form, referred_contact_email: e.target.value })} className="portal-field-x" />
            <input placeholder="Contact Phone" value={form.referred_contact_phone} onChange={(e) => setForm({ ...form, referred_contact_phone: e.target.value })} className="portal-field-x" />
            <input type="number" placeholder="Opportunity Value" value={form.opportunity_value} onChange={(e) => setForm({ ...form, opportunity_value: e.target.value })} className="portal-field-x" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="portal-field-x w-full h-20" />
          <button type="submit" disabled={submitting} className="portal-btn-x disabled:opacity-50">{submitting ? "Submitting..." : "Submit Referral"}</button>
        </form>
      )}

      {/* List */}
      <section className="portal-panel-x p-4 sm:p-5">
        <div className="mb-5">
          <p className="portal-meta-x">Referral ledger</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">Submitted opportunities</h2>
        </div>
        <div className="space-y-3">
        {referrals.map((r) => {
          const cfg = (r.Status ? statusConfig[r.Status] : undefined) || statusConfig.submitted;
          return (
            <div key={r.ID} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="portal-meta-x">Organisation</p>
                  <h3 className="font-display mt-1 text-xl font-semibold">{r.ReferredOrgName || "Unnamed referral"}</h3>
                  <p className="mt-1 text-sm text-white/50">{r.ReferredContactName} {r.ReferredContactEmail && `· ${r.ReferredContactEmail}`}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${cfg.color} ${cfg.bg}`}>{cfg.icon} {r.Status?.replace("_", " ") || "submitted"}</span>
                  {r.OpportunityValue && <p className="font-display mt-2 text-2xl font-semibold">{format(r.OpportunityValue)}</p>}
                </div>
              </div>
              {r.Notes && <p className="mt-4 rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm leading-relaxed text-white/48">{r.Notes}</p>}
              {r.ConvertedAt && (
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Converted {new Date(r.ConvertedAt).toLocaleDateString()}</span>
                  {r.CommissionAmount && <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" /> {format(r.CommissionAmount)}</span>}
                </div>
              )}
            </div>
          );
        })}
          {referrals.length === 0 && (
            <PortalEmptyState
              icon={Users}
              eyebrow="Referral ledger"
              title="No referrals yet"
              description="Submit the first opportunity to start tracking value, qualification status, and commission movement."
              action={
                <button onClick={() => setShowForm(true)} className="portal-btn-x">
                  <Plus className="h-4 w-4" />
                  Submit referral
                </button>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
