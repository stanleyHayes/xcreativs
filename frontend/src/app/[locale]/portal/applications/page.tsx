"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Briefcase, Clock, CheckCircle, XCircle, Calendar, Mail } from "lucide-react";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  received: { icon: <Mail className="w-4 h-4" />, color: "text-white/60", label: "Received", bg: "bg-white/5" },
  under_review: { icon: <Clock className="w-4 h-4" />, color: "text-yellow-400", label: "Under Review", bg: "bg-yellow-400/10" },
  interview_scheduled: { icon: <Calendar className="w-4 h-4" />, color: "text-signal", label: "Interview Scheduled", bg: "bg-signal/10" },
  offer: { icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400", label: "Offer", bg: "bg-green-400/10" },
  declined: { icon: <XCircle className="w-4 h-4" />, color: "text-red-400", label: "Declined", bg: "bg-red-400/10" },
  withdrawn: { icon: <XCircle className="w-4 h-4" />, color: "text-white/30", label: "Withdrawn", bg: "bg-white/5" },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myApplications()
      .then((d) => { setApplications(d.applications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/60">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">My Applications</h1>
      <p className="text-white/50 mb-8">Track the status of your job applications at XCreativs.</p>

      <div className="space-y-4">
        {applications.map((app) => {
          const config = statusConfig[app.Status] || statusConfig.received;
          const roleTitle = app.Answers?.["_role_title"] || "Unknown Role";
          return (
            <div key={app.ID} className="border border-white/10 rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${config.bg} ${config.color}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium">{roleTitle}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${config.color} ${config.bg}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-white/40">
                        Applied {new Date(app.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {app.Notes && (
                      <p className="text-sm text-white/50 mt-2">{app.Notes}</p>
                    )}
                    {app.ReviewedAt && (
                      <p className="text-xs text-white/30 mt-1">
                        Last updated {new Date(app.ReviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {config.icon}
                </div>
              </div>
            </div>
          );
        })}

        {applications.length === 0 && (
          <div className="border border-white/10 rounded-lg p-8 text-center">
            <Briefcase className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No applications yet.</p>
            <a href="/careers" className="text-sm text-signal hover:underline mt-2 inline-block">
              Browse open roles
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
