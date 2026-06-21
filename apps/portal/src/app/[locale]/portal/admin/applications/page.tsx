"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { Briefcase, Calendar, ChevronDown, ChevronUp, ExternalLink, CheckCircle, Plus } from "lucide-react";

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
const APPLICATION_STATUS_OPTIONS = statusOptions.map((value) => ({ value, label: statusLabels[value] }));
const APPLICATION_FILTER_OPTIONS = [{ value: "", label: "All statuses" }, ...APPLICATION_STATUS_OPTIONS];
const INTERVIEW_TYPE_OPTIONS = [
  { value: "phone", label: "Phone" },
  { value: "technical", label: "Technical" },
  { value: "onsite", label: "Onsite" },
  { value: "final", label: "Final" },
];

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
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const roleAdminHref = locale === "en" ? "/portal/admin/career-opportunities" : `/${locale}/portal/admin/career-opportunities`;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="portal-skeleton-x h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Talent</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Applicant tracking</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Review applications, schedule interviews, assign assessments, and move candidates through the hiring pipeline.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`${roleAdminHref}?new=1`} className="portal-btn-x">
              <Plus className="h-4 w-4" />
              New role
            </Link>
            <Link href={roleAdminHref} className="portal-btn-secondary-x">
              <Briefcase className="h-4 w-4" />
              Manage roles
            </Link>
            <CustomSelect value={filter} onChange={setFilter} options={APPLICATION_FILTER_OPTIONS} variant="portal" className="sm:w-48" />
          </div>
        </div>
      </section>

      {apps.length === 0 && (
        <div className="portal-panel-x p-8 text-center text-white/40">
          <Briefcase className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <h2 className="font-display text-xl font-semibold text-white/72">No applications found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">Applications will appear here once candidates submit role forms.</p>
        </div>
      )}

      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="portal-card-x">
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
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
              <span className={`portal-chip-x ${statusColors[a.status] || ""}`}>{statusLabels[a.status] || a.status}</span>
              <CustomSelect
                value={a.status}
                disabled={updating === a.id}
                onChange={(value) => updateStatus(a.id, value)}
                options={APPLICATION_STATUS_OPTIONS}
                variant="portal"
                className="lg:w-44"
                triggerClassName="text-xs"
              />
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
                      <button onClick={() => setShowSchedule(showSchedule === a.id ? null : a.id)} className="portal-admin-action-x">Schedule</button>
                  </div>
                  {(interviews[a.id] || []).map((i) => (
                    <div key={i.id} className="portal-card-x mb-1.5 flex items-center gap-3 px-3 py-2 text-xs">
                      <span className="capitalize font-medium">{i.interview_type}</span>
                      <span className="text-white/50">{new Date(i.scheduled_at).toLocaleString()}</span>
                      <span className="text-white/40">{i.duration_minutes}m</span>
                      {i.interviewer_names?.length > 0 && <span className="text-white/40">{i.interviewer_names.join(", ")}</span>}
                      <span className={`ml-auto portal-chip-x ${i.status === "completed" ? "text-green-400 bg-green-400/10" : i.status === "cancelled" ? "text-red-400 bg-red-400/10" : "text-purple-400 bg-purple-400/10"}`}>{i.status}</span>
                      {i.status === "scheduled" && (
                        <button onClick={async () => { await api.updateInterview(i.id, { status: "completed" }); loadInterviews(a.id); }} className="text-white/40 hover:text-green-400" title="Mark complete"><CheckCircle className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  {(interviews[a.id] || []).length === 0 && <p className="text-xs text-white/30">No interviews scheduled.</p>}

                  {showSchedule === a.id && (
                    <div className="portal-panel-x mt-2 grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
                      <CustomSelect value={iv.interview_type} onChange={(value) => setIv({ ...iv, interview_type: value })} options={INTERVIEW_TYPE_OPTIONS} variant="portal" triggerClassName="text-xs" />
                      <input type="datetime-local" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} className="portal-field-x text-xs" />
                      <input type="number" value={iv.duration_minutes} onChange={(e) => setIv({ ...iv, duration_minutes: Number(e.target.value) })} placeholder="Minutes" className="portal-field-x text-xs" />
                      <input value={iv.location} onChange={(e) => setIv({ ...iv, location: e.target.value })} placeholder="Meeting link / location" className="portal-field-x text-xs" />
                      <input value={iv.interviewer_names} onChange={(e) => setIv({ ...iv, interviewer_names: e.target.value })} placeholder="Interviewers (comma-separated)" className="md:col-span-3 portal-field-x text-xs" />
                      <button onClick={() => schedule(a.id)} disabled={!iv.scheduled_at} className="portal-btn-x disabled:opacity-50">Schedule</button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-wider text-white/40">Assessments</h4>
                    {challenges.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CustomSelect
                          value={assignChoice[a.id] || ""}
                          onChange={(value) => setAssignChoice({ ...assignChoice, [a.id]: value })}
                          options={[
                            { value: "", label: "Assign challenge...", disabled: true },
                            ...challenges.map((challenge) => ({ value: challenge.id, label: challenge.title })),
                          ]}
                          variant="portal"
                          className="min-w-48"
                          triggerClassName="text-xs"
                        />
                        <button onClick={() => assign(a.id)} disabled={!assignChoice[a.id]} className="portal-admin-action-x disabled:opacity-40">Assign</button>
                      </div>
                    )}
                  </div>
                  {(assessments[a.id] || []).map((as) => (
                    <div key={as.id} className="portal-card-x mb-1.5 flex items-center gap-3 px-3 py-2 text-xs">
                      <span className="font-medium">{as.challenge_title}</span>
                      <span className={`portal-chip-x ${as.status === "reviewed" ? "text-green-400 bg-green-400/10" : as.status === "submitted" ? "text-blue-400 bg-blue-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>{as.status}</span>
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
