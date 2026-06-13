import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — XCreativs Technologies",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gravity text-foundation">
      <div className="text-center px-6">
        <WifiOff className="w-12 h-12 text-signal mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">You are offline</h1>
        <p className="text-white/60 max-w-md mx-auto">
          XCreativs works best with an internet connection. Some portal data may be cached for offline reference.
          Please reconnect to access the full platform.
        </p>
      </div>
    </main>
  );
}
