import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Residency — XCreativs Technologies",
  description: "XCreativs Technologies data residency policy. Where client data lives, how it is protected, and how sovereignty is maintained.",
};

export default function DataResidencyPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Data Residency</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Where your data lives, how it is protected, and how sovereignty is maintained.
      </p>

      <div className="mt-12 max-w-3xl space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-3">Principle</h2>
          <p className="text-gravity/70 leading-relaxed">
            XCreativs Technologies designs every system with data sovereignty as a first-class constraint.
            For government clients, this means primary data storage within national borders. For enterprise
            clients, it means storage in the jurisdiction of their choosing, with clear contractual guarantees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Default Residency</h2>
          <p className="text-gravity/70 leading-relaxed">
            Unless otherwise specified in the engagement agreement, all client data for African mandates
            is stored in AWS regions located in South Africa (af-south-1) or Nigeria (af-west-1).
            European mandates default to Frankfurt (eu-central-1) or Ireland (eu-west-1).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Encryption</h2>
          <p className="text-gravity/70 leading-relaxed">
            All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Encryption keys
            are managed through AWS KMS or HashiCorp Vault, with key material never leaving the
            designated residency region.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Subprocessors</h2>
          <p className="text-gravity/70 leading-relaxed">
            We maintain a published list of all subprocessors with their data residency characteristics.
            No subprocessor is engaged for client data processing without explicit contractual commitment
            to matching the client&apos;s residency requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Audit & Compliance</h2>
          <p className="text-gravity/70 leading-relaxed">
            Annual third-party audits verify residency compliance. Clients may request residency attestations
            at any time during an active engagement. All audit reports are shared under NDA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Questions</h2>
          <p className="text-gravity/70 leading-relaxed">
            For data residency questions specific to your engagement, contact your engagement lead
            or email security@xcreativs.com.
          </p>
        </section>
      </div>
    </main>
  );
}
