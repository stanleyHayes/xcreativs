"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle, TrendingUp } from "lucide-react";

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

  const roleMeta = [role.Department, role.Location || "Remote", role.EmploymentType].filter(
    (item): item is string => Boolean(item)
  );

  return (
    <main>
      <section className="relative overflow-hidden border-b border-hairline bg-soft">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_75%_10%,black,transparent_70%)]" />
        <div className="shell-x relative py-16 lg:py-24">
          <Link href="/careers" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal">
            <ArrowLeft className="h-4 w-4" /> All Roles
          </Link>
          <p className="kicker-x text-signal">Open role</p>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
            {role.Title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {roleMeta.map((item) => (
              <span key={item} className="chip-x">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="shell-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-3 lg:py-20">
          <div className="space-y-6 lg:col-span-2">
            <section className="panel-x p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-hairline bg-foundation text-signal">
                  <Briefcase className="h-5 w-5" />
                </span>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Summary</h2>
              </div>
              <p className="prose-x mt-5">{role.Summary}</p>
            </section>

            {role.Responsibilities && role.Responsibilities.length > 0 && (
              <RoleList title="Responsibilities" items={role.Responsibilities} />
            )}
            {role.Requirements && role.Requirements.length > 0 && (
              <RoleList title="Requirements" items={role.Requirements} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="panel-x p-6">
              <p className="kicker-x">Compensation</p>
              <p className="mt-3 text-sm leading-relaxed text-gravity/70">{role.CompensationPhilosophy || "Competitive"}</p>
            </div>
            <div className="panel-x p-6">
              <TrendingUp className="h-5 w-5 text-signal" />
              <p className="mt-4 kicker-x">Growth</p>
              <p className="mt-3 text-sm leading-relaxed text-gravity/70">{role.GrowthTrajectory || "Clear trajectory"}</p>
            </div>
            <Link href={`/careers/${role.Slug}/apply`} className="btn-x w-full">
              Apply for this Role <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function RoleList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="panel-x p-6 lg:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-6 space-y-3">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-gravity/70">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
