import Image from "next/image";

// Pure-CSS intro splash. Lives in the layout, so it plays once on a hard load
// and stays hidden across client-side navigations (the layout never remounts).
// Reduced-motion users skip it (the global reduced-motion rule collapses the
// fade-out to near-instant).
export default function SplashScreen() {
  return (
    <div
      aria-hidden
      className="xc-splash fixed inset-0 z-[120] flex flex-col items-center justify-center bg-foundation"
    >
      <div className="relative flex flex-col items-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="xc-splash-ring absolute inset-0 rounded-full border border-signal/30" />
          <span
            className="xc-splash-ring absolute inset-0 rounded-full border border-signal/20"
            style={{ animationDelay: "0.25s" }}
          />
          <Image
            src="/logo.svg"
            alt=""
            width={56}
            height={56}
            priority
            className="animate-float relative h-14 w-14"
          />
        </div>

        <span className="xc-splash-word font-display mt-6 text-2xl font-semibold tracking-tight">
          XCreativs
        </span>

        <span className="mt-5 block h-0.5 w-32 overflow-hidden rounded-full bg-hairline">
          <span className="xc-splash-bar block h-full w-full bg-signal" />
        </span>
      </div>
    </div>
  );
}
