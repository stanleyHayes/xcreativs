import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers — XCreativs Technologies",
  description:
    "Senior practitioners and emerging talent who want to work on national-scale systems. Join the talent network or apply for open roles.",
};

async function getRoles() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/careers/roles`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { roles: [] };
  return res.json();
}

export default async function CareersPage() {
  const data = await getRoles();
  const roles = data.roles || [];

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Careers</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Not a job board. A serious-firm recruiting tool for senior practitioners and emerging talent who want to work on national-scale systems.
      </p>

      <div className="mt-12 space-y-6">
        {roles.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No open roles at the moment.</p>
        )}
        {roles.map((r: any) => (
          <Link
            key={r.Slug}
            href={`/careers/${r.Slug}`}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-hairline rounded p-6 hover:border-signal transition-colors"
          >
            <div>
              <h2 className="text-lg font-semibold group-hover:text-signal transition-colors">
                {r.Title}
              </h2>
              <p className="mt-1 text-sm text-gravity/60">
                {r.Department} · {r.Location || "Remote"} · {r.EmploymentType}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-signal">
              Apply <Briefcase className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16 border border-hairline rounded p-8 bg-soft">
        <div className="flex items-start gap-4">
          <Users className="w-6 h-6 text-signal shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold">Talent Network</h2>
            <p className="mt-1 text-gravity/60">
              No role fits but you want to be known to us? Join the talent network and we will notify you when a fitting role opens.
            </p>
            <Link
              href="/careers/talent-network"
              className="mt-4 inline-block text-sm font-medium text-signal hover:underline"
            >
              Join the network →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
