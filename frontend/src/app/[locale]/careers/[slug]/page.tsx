"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface Role {
  Title?: string;
  Department?: string;
  Location?: string;
  EmploymentType?: string;
  Summary?: string;
  Responsibilities?: string[];
  Requirements?: string[];
  CompensationPhilosophy?: string;
  GrowthTrajectory?: string;
  Slug?: string;
}

export default function RoleDetailPage() {
  const { slug } = useParams();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getRole(slug as string).then((d) => { setRole(d as Role); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!role) return <div className="p-12 text-center">Role not found</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal mb-8">
        <ArrowLeft className="w-4 h-4" /> All Roles
      </Link>
      <h1 className="text-3xl lg:text-5xl font-bold">{role.Title}</h1>
      <p className="mt-2 text-gravity/60">
        {role.Department} · {role.Location || "Remote"} · {role.EmploymentType}
      </p>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-3">Summary</h2>
            <p className="text-gravity/70 leading-relaxed">{role.Summary}</p>
          </section>
          {role.Responsibilities && role.Responsibilities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 text-gravity/70">
                {role.Responsibilities.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {role.Requirements && role.Requirements.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gravity/70">
                {role.Requirements.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="space-y-6">
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Compensation</p>
            <p className="mt-1 text-sm text-gravity/70">{role.CompensationPhilosophy || "Competitive"}</p>
          </div>
          <div className="border border-hairline rounded p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Growth</p>
            <p className="mt-1 text-sm text-gravity/70">{role.GrowthTrajectory || "Clear trajectory"}</p>
          </div>
          <Link
            href={`/careers/${role.Slug}/apply`}
            className="block text-center bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Apply for this Role
          </Link>
        </aside>
      </div>
    </main>
  );
}
