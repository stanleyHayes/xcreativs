"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let newWorker: ServiceWorker | null = null;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      registration.update();
      registration.addEventListener("updatefound", () => {
        newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker?.state === "installed" && navigator.serviceWorker.controller) {
              setShowPrompt(true);
            }
          });
        }
      });
    };

    navigator.serviceWorker.ready.then(handleUpdate);

    // Also check periodically
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update());
    }, 60 * 60 * 1000); // hourly

    return () => clearInterval(interval);
  }, []);

  function handleReload() {
    if (typeof window === "undefined") return;
    // Tell SW to skip waiting
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gravity border border-white/10 rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Update available</p>
          <p className="text-xs text-white/50 mt-0.5">
            A new version of XCreativs is ready. Reload to update.
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-white/40 hover:text-white shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={handleReload}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-signal text-black px-3 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-4 h-4" />
        Reload now
      </button>
    </div>
  );
}
