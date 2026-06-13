"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black text-center py-1.5 px-4 z-50 text-xs font-medium flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      You are offline. Some features may be limited.
    </div>
  );
}
