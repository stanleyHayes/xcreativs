"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";

/**
 * Converts legacy window.alert calls into a non-blocking, accessible product
 * notification. This keeps older workflows usable while the apps share one
 * consistent feedback surface.
 */
export default function AlertBridge() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (value?: unknown) => {
      setMessage(String(value ?? "Something needs your attention."));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), 6500);
    };

    return () => {
      window.alert = nativeAlert;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[120] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div
        role="alert"
        aria-live="assertive"
        className="animate-pop flex w-full max-w-md items-start gap-3 border border-signal/35 bg-[#0a0d14] p-4 text-white shadow-[0_24px_70px_-28px_rgba(0,0,0,.75)]"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/78">{message}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/10 text-white/55 transition-colors hover:border-signal/45 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
