import Image from "next/image";

interface PortalSplashScreenProps {
  persistent?: boolean;
  label?: string;
}

export default function PortalSplashScreen({
  persistent = false,
  label = "Securing your workspace",
}: PortalSplashScreenProps) {
  const shellClass = persistent
    ? "portal-shell-x relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gravity text-foundation"
    : "portal-shell-x xc-splash fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-gravity text-foundation";

  return (
    <div
      role="status"
      aria-label={label}
      aria-hidden={!persistent}
      className={shellClass}
    >
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/10 blur-[130px]" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Logo — pulsing glow + expanding rings */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="xc-splash-glow absolute inset-0 rounded-[1.4rem] bg-signal/30 blur-xl" />
          <span className="xc-splash-ring absolute inset-0 rounded-full border border-signal/25" />
          <span
            className="xc-splash-ring absolute inset-0 rounded-full border border-signal/15"
            style={{ animationDelay: "0.3s" }}
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-signal/20 backdrop-blur">
            <Image src="/logo.svg" alt="" width={54} height={54} priority className="h-14 w-14" />
          </span>
        </div>

        {/* Wordmark */}
        <p className="xc-splash-word font-display mt-8 text-3xl font-semibold tracking-tight">
          XCreativs <span className="text-signal">Portal</span>
        </p>
        <p
          className="xc-splash-word mt-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35"
          style={{ animationDelay: "0.35s" }}
        >
          {label}
        </p>

        {/* Indeterminate progress — continuous sweep */}
        <span className="relative mt-8 block h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="xc-splash-sweep absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-signal to-transparent" />
        </span>
      </div>
    </div>
  );
}
