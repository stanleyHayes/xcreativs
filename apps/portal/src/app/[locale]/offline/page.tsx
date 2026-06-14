import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — XCreativs Technologies",
};

export default function OfflinePage() {
  return (
    <main className="shell-x flex min-h-screen items-center justify-center bg-gravity py-20 text-foundation">
      <div className="portal-panel-x max-w-lg p-8 text-center lg:p-10">
        <WifiOff className="mx-auto mb-5 h-12 w-12 text-signal" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">You are offline</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          XCreativs works best with an internet connection. Some portal data may be cached for offline reference.
          Please reconnect to access the full platform.
        </p>
      </div>
    </main>
  );
}
