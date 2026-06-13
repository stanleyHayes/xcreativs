import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, Users } from "lucide-react";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "Careers — XCreativs Technologies",
  description:
    "Senior practitioners and emerging talent who want to work on national-scale systems. Join the talent network or apply for open roles.",
};

interface CareerRole {
  Slug: string;
  Title: string;
  Department: string;
  Location?: string;
  EmploymentType: string;
}

interface RolesResponse {
  roles: CareerRole[];
}

async function getRoles(): Promise<RolesResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/careers/roles`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { roles: [] };
  return res.json() as Promise<RolesResponse>;
}

export default async function CareersPage() {
  const data = await getRoles();
  const roles = data.roles || [];

  return (
    <>
      <PageBanner
        icon={Users}
        eyebrow="Join the team"
        title="Careers"
        description="Not a job board. A serious-firm recruiting tool for senior practitioners and emerging talent who want to work on national-scale systems."
        crumbs={[{ label: "Home", href: "/" }, { label: "Careers" }]}
      />
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
        <div className="mt-12 space-y-6">
        {roles.length === 0 && (
          <p className="text-center text-gravity/40 py-12">No open roles at the moment.</p>
        )}
        {roles.map((r: CareerRole) => (
          <Link
            key={r.Slug}
            href={`/careers/${r.Slug}`}
            className="group card-x flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6"
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

        <div className="mt-16 card-x p-8">
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
    </>
  );
}
