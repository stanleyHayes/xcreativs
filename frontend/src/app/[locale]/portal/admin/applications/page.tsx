"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Briefcase, Calendar, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  received: "text-yellow-400 bg-yellow-400/10",
  under_review: "text-blue-400 bg-blue-400/10",
  interview_scheduled: "text-purple-400 bg-purple-400/10",
  offer: "text-green-400 bg-green-400/10",
  declined: "text-red-400 bg-red-400/10",
  withdrawn: "text-white/40 bg-white/5",
};
const statusLabels: Record<string, string> = {
  received: "Received", under_review: "Under Review", interview_scheduled: "Interview", offer: "Offer", declined: "Declined", withdrawn: "Withdrawn",
};
const statusOptions = ["received", "under_review", "interview_scheduled", "offer", "declined", "withdrawn"];

interface Application {
  id: string; applicant_name: string; applicant_email: string; applicant_phone: string;
  resume_url: string; portfolio_url: string; linkedin_url: string; status: string;
  notes: string; role_title: string; role_slug: string; created_at: string; interview_count: number;
}
interface Interview {
  id: string; interview_type: string; scheduled_at: string; duration_minutes: number;
  location: string; interviewer_names: string[]; status: string; feedback: string;
}
interface Challenge {
  id: string; title: string;
}
interface Assessment {
  id: string; challenge_title: string; status: string; submission_url?: string;
  score?: number | null; due_at?: string | null;
}

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Record<string, Interview[]>>({});
  const [showSchedule, setShowSchedule] = useState<string | null>(null);
  const [iv, setIv] = useState({ interview_type: "phone", scheduled_at: "", duration_minutes: 45, location: "", interviewer_names: "" });
  const [assessments, setAssessments] = useState<Record<string, Assessment[]>>({});
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [assignChoice, setAssignChoice] = useState<Record<string, string>>({});

  const loadApps = useCallback(async (): Promise<Application[]> => {
    try { const res = await api.listApplicationsAdmin(filter || undefined); return (res.applications || []) as unknown as Application[]; }
    catch { return []; }
  }, [filter]);

  const fetchApps = useCallback(async () => {
    const next = await loadApps();
    setApps(next);
    setLoading(false);
  }, [loadApps]);

  useEffect(() => {
    let active = true;
    loadApps().then((next) => {
      if (!active) return;
      setApps(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, [loadApps]);
  useEffect(() => { api.listChallenges().then((d) => setChallenges((d.challenges || []) as unknown as Challenge[])).catch(() => {}); }, []);

  async function loadAssessments(id: string) {
    try { const res = await api.listAssignments(id); setAssessments((m) => ({ ...m, [id]: (res.assignments || []) as unknown as Assessment[] })); } catch { /* ignore */ }
  }
  async function assign(id: string) {
    const cid = assignChoice[id];
    if (!cid) return;
    try { await api.assignChallenge(id, { challenge_id: cid, due_in_days: 5 }); await loadAssessments(id); }
    catch { alert("Failed to assign challenge"); }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try { await api.updateApplicationStatus(id, { status }); await fetchApps(); }
    catch { alert("Failed to update status"); }
    finally { setUpdating(null); }
  }

  async function loadInterviews(id: string) {
    try { const res = await api.listInterviews(id); setInterviews((m) => ({ ...m, [id]: (res.interviews || []) as unknown as Interview[] })); } catch { /* ignore */ }
  }

  function toggle(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!interviews[id]) loadInterviews(id);
    if (!assessments[id]) loadAssessments(id);
  }

  async function schedule(id: string) {
    if (!iv.scheduled_at) return;
    try {
      await api.scheduleInterview(id, { ...iv, interviewer_names: iv.interviewer_names.split(",").map((s) => s.trim()).filter(Boolean) });
      setShowSchedule(null);
      setIv({ interview_type: "phone", scheduled_at: "", duration_minutes: 45, location: "", interviewer_names: "" });
      await loadInterviews(id);
      await fetchApps();
    } catch { alert("Failed to schedule interview"); }
  }

  if (loading) return <div className="text-white/60 p-8">Loading...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-signal" /> Applicant Tracking</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-signal">
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
      </div>

      {apps.length === 0 && <p className="text-white/40 text-sm py-8 text-center">No applications.</p>}

      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="border border-white/10 rounded-lg bg-white/[0.02]">
            <div className="flex items-center gap-4 p-4">
              <button onClick={() => toggle(a.id)} className="text-white/40 hover:text-white/70">
                {expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{a.applicant_name}</span>
                  {a.role_title && <span className="text-xs text-white/40">· {a.role_title}</span>}
                  {a.interview_count > 0 && <span className="text-xs text-purple-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{a.interview_count}</span>}
                </div>
                <p className="text-xs text-white/40">{a.applicant_email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || ""}`}>{statusLabels[a.status] || a.status}</span>
              <select value={a.status} disabled={updating === a.id} onChange={(e) => updateStatus(a.id, e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-signal">
                {statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            </div>

            {expandedId === a.id && (
              <div className="border-t border-white/10 p-4 space-y-4">
                <div className="flex flex-wrap gap-3 text-xs">
                  {a.resume_url && <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline flex items-center gap-1">Resume <ExternalLink className="w-3 h-3" /></a>}
                  {a.portfolio_url && <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline flex items-center gap-1">Portfolio <ExternalLink className="w-3 h-3" /></a>}
                  {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline flex items-center gap-1">LinkedIn <ExternalLink className="w-3 h-3" /></a>}
                  {a.applicant_phone && <span className="text-white/50">{a.applicant_phone}</span>}
                </div>
                {a.notes && <p className="text-sm text-white/60 bg-white/5 rounded p-2">{a.notes}</p>}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-wider text-white/40">Interviews</h4>
                    <button onClick={() => setShowSchedule(showSchedule === a.id ? null : a.id)} className="text-xs text-signal hover:underline">+ Schedule</button>
                  </div>
                  {(interviews[a.id] || []).map((i) => (
                    <div key={i.id} className="flex items-center gap-3 text-xs border border-white/10 rounded px-3 py-2 mb-1.5">
                      <span className="capitalize font-medium">{i.interview_type}</span>
                      <span className="text-white/50">{new Date(i.scheduled_at).toLocaleString()}</span>
                      <span className="text-white/40">{i.duration_minutes}m</span>
                      {i.interviewer_names?.length > 0 && <span className="text-white/40">{i.interviewer_names.join(", ")}</span>}
                      <span className={`ml-auto px-2 py-0.5 rounded-full ${i.status === "completed" ? "text-green-400 bg-green-400/10" : i.status === "cancelled" ? "text-red-400 bg-red-400/10" : "text-purple-400 bg-purple-400/10"}`}>{i.status}</span>
                      {i.status === "scheduled" && (
                        <button onClick={async () => { await api.updateInterview(i.id, { status: "completed" }); loadInterviews(a.id); }} className="text-white/40 hover:text-green-400" title="Mark complete"><CheckCircle className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  {(interviews[a.id] || []).length === 0 && <p className="text-xs text-white/30">No interviews scheduled.</p>}

                  {showSchedule === a.id && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 border border-white/10 rounded p-3">
                      <select value={iv.interview_type} onChange={(e) => setIv({ ...iv, interview_type: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs">
                        <option value="phone">Phone</option><option value="technical">Technical</option><option value="onsite">Onsite</option><option value="final">Final</option>
                      </select>
                      <input type="datetime-local" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs" />
                      <input type="number" value={iv.duration_minutes} onChange={(e) => setIv({ ...iv, duration_minutes: Number(e.target.value) })} placeholder="Minutes" className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs" />
                      <input value={iv.location} onChange={(e) => setIv({ ...iv, location: e.target.value })} placeholder="Meeting link / location" className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs" />
                      <input value={iv.interviewer_names} onChange={(e) => setIv({ ...iv, interviewer_names: e.target.value })} placeholder="Interviewers (comma-separated)" className="md:col-span-3 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs" />
                      <button onClick={() => schedule(a.id)} disabled={!iv.scheduled_at} className="bg-signal text-black rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50">Schedule</button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-wider text-white/40">Assessments</h4>
                    {challenges.length > 0 && (
                      <div className="flex items-center gap-1">
                        <select value={assignChoice[a.id] || ""} onChange={(e) => setAssignChoice({ ...assignChoice, [a.id]: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs">
                          <option value="">Assign challenge…</option>
                          {challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <button onClick={() => assign(a.id)} disabled={!assignChoice[a.id]} className="text-xs text-signal hover:underline disabled:opacity-40">Assign</button>
                      </div>
                    )}
                  </div>
                  {(assessments[a.id] || []).map((as) => (
                    <div key={as.id} className="flex items-center gap-3 text-xs border border-white/10 rounded px-3 py-2 mb-1.5">
                      <span className="font-medium">{as.challenge_title}</span>
                      <span className={`px-2 py-0.5 rounded-full ${as.status === "reviewed" ? "text-green-400 bg-green-400/10" : as.status === "submitted" ? "text-blue-400 bg-blue-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>{as.status}</span>
                      {as.submission_url && <a href={as.submission_url} target="_blank" rel="noopener noreferrer" className="text-signal hover:underline">submission</a>}
                      {as.score != null && <span className="text-white/50">score {as.score}</span>}
                      <span className="ml-auto text-white/30">{as.due_at ? `due ${new Date(as.due_at).toLocaleDateString()}` : ""}</span>
                    </div>
                  ))}
                  {(assessments[a.id] || []).length === 0 && <p className="text-xs text-white/30">No assessments assigned.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
