export default function SecurityPage() {
  return (
    <main className="legal-page-x">
      <div className="shell-x relative py-20">
        <div className="legal-copy-x max-w-4xl">
      <p className="kicker-x mb-4">Trust center</p>
      <h1>Security</h1>
      <p className="mt-6 max-w-3xl">
        Security is not a feature; it is a foundation. XCreativs Technologies operates sovereign-by-default and maintains a rigorous security posture.
      </p>
      <div className="mt-12 space-y-8 max-w-3xl">
        <section>
          <h2>Infrastructure</h2>
          <p>All production systems run on hardened infrastructure with regular patching, monitoring, and penetration testing.</p>
        </section>
        <section>
          <h2>Authentication</h2>
          <p>Multi-factor authentication is mandatory for all authenticated users. No exceptions.</p>
        </section>
        <section>
          <h2>Audit</h2>
          <p>Every action in the client portal is logged with timestamp, user, IP, and resource. Exportable for compliance review.</p>
        </section>
      </div>
        </div>
      </div>
    </main>
  );
}
