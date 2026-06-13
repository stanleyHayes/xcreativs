export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Privacy Policy</h1>
      <p className="mt-6 text-gravity/70 max-w-3xl leading-relaxed">
        XCreativs Technologies is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
      </p>
      <div className="mt-12 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Data Collection</h2>
          <p className="text-gravity/70">We collect information you provide directly to us, such as when you fill out forms or communicate with us.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data Use</h2>
          <p className="text-gravity/70">We use your data to provide and improve our services, communicate with you, and comply with legal obligations.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Sovereignty</h2>
          <p className="text-gravity/70">By default, data is stored in-region. We offer on-premise deployment for sovereignty-conscious clients.</p>
        </section>
      </div>
    </main>
  );
}
