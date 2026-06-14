"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileUpload } from "@xc/ui/FileUpload";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface Role {
  Title?: string;
  Slug?: string;
  Department?: string;
  Location?: string;
  EmploymentType?: string;
}

export default function ApplyRolePage() {
  const { slug } = useParams();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    resume_url: "",
    portfolio_url: "",
    linkedin_url: "",
    cover_letter: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .getRole(slug as string)
      .then((d) => setRole(d as Role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.applyRole(slug as string, form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!role) return <div className="p-12 text-center">Role not found</div>;

  if (submitted) {
    return (
      <main className="shell-x flex min-h-[80vh] items-center justify-center py-20">
        <div className="panel-x max-w-lg p-8 text-center lg:p-10">
          <CheckCircle className="mx-auto mb-5 h-12 w-12 text-signal" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Application Received</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gravity/60">
            Thank you for applying to <span className="font-medium">{role.Title}</span>. Our team reviews every
            application personally and will be in touch if there is a fit.
          </p>
          <Link href="/careers" className="btn-x-secondary mt-7">
            Back to all roles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell-x py-20">
      <Link
        href={`/careers/${role.Slug}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal"
      >
        <ArrowLeft className="w-4 h-4" /> Back to role
      </Link>

      <div className="panel-x max-w-3xl p-6 lg:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">§ 05 · Careers</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">Apply: {role.Title}</h1>
        <p className="mt-2 text-gravity/60">
          {role.Department} · {role.Location || "Remote"} · {role.EmploymentType}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <input
            required
            value={form.applicant_name}
            onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
            placeholder="Full Name *"
            className="field-x"
          />
          <input
            required
            type="email"
            value={form.applicant_email}
            onChange={(e) => setForm({ ...form, applicant_email: e.target.value })}
            placeholder="Email *"
            className="field-x"
          />
          <input
            value={form.applicant_phone}
            onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })}
            placeholder="Phone"
            className="field-x"
          />
          <div>
            <label className="block text-xs text-gravity/60 mb-1">Résumé / CV</label>
            <FileUpload
              value={form.resume_url}
              onChange={(url) => setForm({ ...form, resume_url: url })}
              folder="resumes"
              accept=".pdf,.doc,.docx,.rtf,.txt"
              label="Upload résumé (PDF / DOC)"
            />
          </div>
          <input
            type="url"
            value={form.portfolio_url}
            onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
            placeholder="Portfolio URL"
            className="field-x"
          />
          <input
            type="url"
            value={form.linkedin_url}
            onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            placeholder="LinkedIn URL"
            className="field-x"
          />
          <textarea
            value={form.cover_letter}
            onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
            placeholder="Why this role? Tell us about relevant work you have shipped."
            className="field-x h-32"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-x disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
