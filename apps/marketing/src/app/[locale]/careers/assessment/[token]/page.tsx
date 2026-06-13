"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { FileUpload } from "@xc/ui/FileUpload";
import { Clock, CheckCircle, Code } from "lucide-react";

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
  if (error && !challenge) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (!challenge) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-12 py-16">
      <p className="text-xs font-medium uppercase tracking-wider text-signal mb-2 flex items-center gap-1"><Code className="w-3.5 h-3.5" /> Technical Assessment</p>
      <h1 className="text-3xl font-bold">{challenge.title}</h1>
      <p className="mt-2 text-gravity/60">Hi {challenge.applicant_name}, here is your assessment.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gravity/50">
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {challenge.time_limit_minutes} min</span>
        {challenge.due_at && <span>Due {new Date(challenge.due_at).toLocaleString()}</span>}
        {challenge.skills && challenge.skills.length > 0 && <span>{challenge.skills.join(" · ")}</span>}
      </div>

      {challenge.description && <p className="mt-8 text-gravity/80 leading-relaxed whitespace-pre-line">{challenge.description}</p>}
      {challenge.prompt && (
        <div className="mt-6 border border-hairline rounded-lg p-5 bg-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40 mb-2">Brief</p>
          <p className="text-gravity/80 leading-relaxed whitespace-pre-line">{challenge.prompt}</p>
        </div>
      )}

      {done ? (
        <div className="mt-10 border border-hairline rounded-lg p-8 text-center bg-soft">
          <CheckCircle className="w-8 h-8 text-signal mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Submission received</h2>
          <p className="mt-1 text-gravity/60">Thank you. Our team will review your work and follow up.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Submit your work</h2>
          <input type="url" value={form.submission_url} onChange={(e) => setForm({ ...form, submission_url: e.target.value })} placeholder="Link to your solution (repo, doc, deployed URL)" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal bg-foundation" />
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
          <textarea value={form.submission_notes} onChange={(e) => setForm({ ...form, submission_notes: e.target.value })} placeholder="Notes for the reviewers (approach, trade-offs, what you'd do with more time)…" className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal bg-foundation h-32" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting || (!form.submission_url && !form.submission_notes)} className="bg-signal text-white px-6 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit Assessment"}
          </button>
        </form>
      )}
    </main>
  );
}
