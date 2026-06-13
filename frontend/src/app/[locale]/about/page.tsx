import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — XCreativs Technologies",
  description:
    "We build intelligent digital systems for governments and enterprises. National-scale platforms, AI integration, and strategic advisory.",
};

async function getAbout() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/pages/about`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function AboutPage() {
  const page = await getAbout();
  const data = page?.Data || {};

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">About</h1>
      <p className="mt-6 text-lg text-gravity/70 max-w-3xl">{data.mission || "We build intelligent digital systems for governments and enterprises."}</p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">Mission</h2>
          <p className="text-gravity/70 leading-relaxed">{data.mission || "To build intelligent digital systems that give governments and enterprises strategic advantage."}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4">Operating Principles</h2>
          <ul className="list-disc list-inside space-y-2 text-gravity/70">
            <li>Sovereign-by-default</li>
            <li>Architecture-first</li>
            <li>Compound infrastructure</li>
            <li>Serious firms only</li>
          </ul>
        </section>
      </div>

      {data.founders && (
        <div className="mt-16">
          <h2 className="text-xl font-semibold mb-6">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.founders.map((f: any, i: number) => (
              <div key={i} className="border border-hairline rounded p-6">
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-gravity/60">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
