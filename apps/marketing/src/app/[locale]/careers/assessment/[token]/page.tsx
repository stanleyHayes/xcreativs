"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileUpload } from "@xc/ui/FileUpload";
import EmptyState from "@xc/ui/EmptyState";
import { Clock, CheckCircle, Code, AlertTriangle } from "lucide-react";

interface CandidateChallenge {
  title: string;
  applicant_name: string;
  time_limit_minutes: number;
  status?: string;
  due_at?: string | null;
  skills?: string[];
  description?: string | null;
  prompt?: string | null;
}

export default function CandidateAssessmentPage() {
  const { token } = useParams();
  const [challenge, setChallenge] = useState<CandidateChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ submission_url: "", submission_notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getCandidateChallenge(token as string)
      .then((d) => { const c = d as unknown as CandidateChallenge; setChallenge(c); if (c.status === "submitted" || c.status === "reviewed") setDone(true); })
      .catch(() => setError("This assessment link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.submission_url && !form.submission_notes) return;
    setSubmitting(true);
    try { await api.submitCandidateChallenge(token as string, form); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Submission failed."); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="p-12 text-center">Loading…</div>;
  if (error && !challenge) return <EmptyState icon={AlertTriangle} title="Assessment challenge unavailable" description={error} />;
  if (!challenge) return null;

  return (
    <main className="shell-x py-16">
      <div className="panel-x mx-auto max-w-4xl p-6 lg:p-8">
        <p className="context-label-x mb-4 flex items-center gap-1"><Code className="h-3.5 w-3.5" /> Technical assessment</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight lg:text-5xl">{challenge.title}</h1>
        <p className="mt-3 text-gravity/60">Hi {challenge.applicant_name}, here is your assessment.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gravity/50">
          <span className="chip-x"><Clock className="h-4 w-4" /> {challenge.time_limit_minutes} min</span>
          {challenge.due_at && <span className="chip-x">Due {new Date(challenge.due_at).toLocaleString()}</span>}
          {challenge.skills && challenge.skills.length > 0 && <span className="chip-x">{challenge.skills.join(" · ")}</span>}
        </div>

        {challenge.description && <p className="mt-8 whitespace-pre-line leading-relaxed text-gravity/80">{challenge.description}</p>}
        {challenge.prompt && (
          <div className="panel-x-soft mt-6 p-5">
            <p className="mb-2 text-sm font-medium text-gravity/48">Brief</p>
            <p className="whitespace-pre-line leading-relaxed text-gravity/80">{challenge.prompt}</p>
          </div>
        )}

        {done ? (
          <div className="panel-x-soft mt-10 p-8 text-center">
            <CheckCircle className="mx-auto mb-3 h-9 w-9 text-signal" />
            <h2 className="font-display text-2xl font-semibold tracking-tight">Submission received</h2>
            <p className="mt-2 text-sm text-gravity/60">Thank you. Our team will review your work and follow up.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="panel-x-soft mt-10 space-y-4 p-5 lg:p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight">Submit your work</h2>
            <input type="url" value={form.submission_url} onChange={(e) => setForm({ ...form, submission_url: e.target.value })} placeholder="Link to your solution (repo, doc, deployed URL)" className="field-x" />
            <div className="flex items-center gap-3 text-xs text-gravity/40">
              <span className="h-px flex-1 bg-hairline" /> or upload a file <span className="h-px flex-1 bg-hairline" />
            </div>
            <FileUpload
              value={form.submission_url}
              onChange={(url) => setForm({ ...form, submission_url: url })}
              folder="assessments"
              accept=".pdf,.zip,.doc,.docx,.txt,.md"
              label="Upload your solution (ZIP / PDF)"
            />
            <textarea value={form.submission_notes} onChange={(e) => setForm({ ...form, submission_notes: e.target.value })} placeholder="Notes for the reviewers (approach, trade-offs, what you'd do with more time)…" className="field-x h-32" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting || (!form.submission_url && !form.submission_notes)} className="btn-x disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit Assessment"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
