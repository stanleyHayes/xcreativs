export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Security</h1>
      <p className="mt-6 text-gravity/70 max-w-3xl leading-relaxed">
        Security is not a feature; it is a foundation. XCreativs Technologies operates sovereign-by-default and maintains a rigorous security posture.
      </p>
      <div className="mt-12 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xl font-semibold mb-3">Infrastructure</h2>
          <p className="text-gravity/70">All production systems run on hardened infrastructure with regular patching, monitoring, and penetration testing.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">Authentication</h2>
          <p className="text-gravity/70">Multi-factor authentication is mandatory for all authenticated users. No exceptions.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">Audit</h2>
          <p className="text-gravity/70">Every action in the client portal is logged with timestamp, user, IP, and resource. Exportable for compliance review.</p>
        </section>
      </div>
    </main>
  );
}
