import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Scale } from "lucide-react";
import BannerWatermark from "@xc/ui/BannerWatermark";

type LegalSection = {
  title: string;
  body: string;
};

type LegalDocumentProps = {
  label: string;
  title: string;
  description: string;
  updated: string;
  owner: string;
  sections: LegalSection[];
  assurance: string[];
  icon?: LucideIcon;
};

export default function LegalDocument({
  label,
  title,
  description,
  updated,
  owner,
  sections,
  assurance,
  icon: Icon = Scale,
}: LegalDocumentProps) {
  return (
    <main className="legal-page-x">
      <div className="shell-x py-16 lg:py-20">
        <section className="relative overflow-hidden border-b border-hairline pb-10 lg:pb-14">
          <BannerWatermark icon={Icon} />
          <p className="context-label-x mb-5">{label}</p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div>
              <h1 className="font-display max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight lg:text-7xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gravity/62">
                {description}
              </p>
            </div>

            <aside className="panel-x-soft rounded-lg p-5">
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gravity/50">Last reviewed</dt>
                  <dd className="mt-1 font-semibold text-gravity">{updated}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gravity/50">Owner</dt>
                  <dd className="mt-1 font-semibold text-gravity">{owner}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gravity/50">Questions</dt>
                  <dd className="mt-1">
                    <Link href="/contact" className="font-semibold text-signal hover:text-signal-ink">
                      Contact XCreativs
                    </Link>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-hairline bg-soft p-4">
              <p className="text-sm font-semibold text-gravity">In this document</p>
              <nav className="mt-4 space-y-2">
                {sections.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#section-${index + 1}`}
                    className="block rounded-md px-3 py-2 text-sm text-gravity/62 transition-colors hover:bg-foundation hover:text-signal"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="space-y-5">
            {sections.map((section, index) => (
              <section
                key={section.title}
                id={`section-${index + 1}`}
                className="scroll-mt-28 rounded-lg border border-hairline bg-foundation p-5 lg:p-7"
              >
                <p className="text-sm font-semibold text-signal">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight lg:text-3xl">{section.title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-gravity/68">{section.body}</p>
              </section>
            ))}
          </article>
        </section>

        <section className="border-t border-hairline py-10">
          <p className="context-label-x mb-5">Assurance posture</p>
          <div className="grid gap-3 md:grid-cols-3">
            {assurance.map((item) => (
              <div key={item} className="rounded-lg border border-hairline bg-soft p-4 text-sm leading-6 text-gravity/68">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
