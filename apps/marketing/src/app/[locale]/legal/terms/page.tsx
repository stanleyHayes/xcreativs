export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Terms of Service</h1>
      <p className="mt-6 text-gravity/70 max-w-3xl leading-relaxed">
        These terms govern your use of the XCreativs Technologies web platform. By accessing or using the platform, you agree to be bound by these terms.
      </p>
      <div className="mt-12 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gravity/70">By using this platform, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use of Platform</h2>
          <p className="text-gravity/70">You agree to use the platform only for lawful purposes and in accordance with these terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Intellectual Property</h2>
          <p className="text-gravity/70">All content on this platform is the property of XCreativs Technologies unless otherwise stated.</p>
        </section>
      </div>
    </main>
  );
}
