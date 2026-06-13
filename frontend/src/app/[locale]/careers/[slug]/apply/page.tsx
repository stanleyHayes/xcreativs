"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileUpload } from "@/components/FileUpload";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ApplyRolePage() {
  const { slug } = useParams();
  const [role, setRole] = useState<any>(null);
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
      .then((d) => setRole(d))
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
      <main className="min-h-screen flex items-center justify-center bg-foundation">
        <div className="text-center px-6">
          <CheckCircle className="w-12 h-12 text-signal mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Application Received</h1>
          <p className="text-gravity/60 max-w-md mx-auto">
            Thank you for applying to <span className="font-medium">{role.Title}</span>. Our team reviews every
            application personally and will be in touch if there is a fit.
          </p>
          <Link href="/careers" className="mt-6 inline-block text-signal font-medium hover:underline">
            Back to all roles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link
        href={`/careers/${role.Slug}`}
        className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to role
      </Link>

      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">§ 05 · Careers</p>
        <h1 className="text-3xl lg:text-5xl font-bold">Apply: {role.Title}</h1>
        <p className="mt-2 text-gravity/60">
          {role.Department} · {role.Location || "Remote"} · {role.EmploymentType}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <input
            required
            value={form.applicant_name}
            onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
            placeholder="Full Name *"
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
          />
          <input
            required
            type="email"
            value={form.applicant_email}
            onChange={(e) => setForm({ ...form, applicant_email: e.target.value })}
            placeholder="Email *"
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
          />
          <input
            value={form.applicant_phone}
            onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })}
            placeholder="Phone"
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
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
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
          />
          <input
            type="url"
            value={form.linkedin_url}
            onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            placeholder="LinkedIn URL"
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation"
          />
          <textarea
            value={form.cover_letter}
            onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
            placeholder="Why this role? Tell us about relevant work you have shipped."
            className="w-full border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-32"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-signal text-white px-6 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
