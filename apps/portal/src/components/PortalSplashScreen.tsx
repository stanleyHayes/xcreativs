import Image from "next/image";

interface PortalSplashScreenProps {
  persistent?: boolean;
  label?: string;
}

export default function PortalSplashScreen({
  persistent = false,
  label = "Preparing secure workspace",
}: PortalSplashScreenProps) {
  const shellClass = persistent
    ? "portal-shell-x relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gravity text-foundation"
    : "portal-shell-x xc-splash fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-gravity text-foundation";

  return (
    <div aria-hidden={!persistent} className={shellClass}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/15 blur-[110px]"
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="xc-splash-ring absolute inset-0 rounded-full border border-signal/30" />
          <span
            className="xc-splash-ring absolute inset-0 rounded-full border border-signal/20"
            style={{ animationDelay: "0.25s" }}
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-signal/10">
            <Image src="/logo.svg" alt="" width={52} height={52} priority className="h-13 w-13" />
          </span>
        </div>

        <p className="xc-splash-word font-display mt-7 text-3xl font-semibold tracking-tight">
          XCreativs Portal
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
          {label}
        </p>

        <span className="mt-6 block h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <span className="xc-splash-bar block h-full w-full rounded-full bg-signal" />
        </span>
      </div>
    </div>
  );
}
