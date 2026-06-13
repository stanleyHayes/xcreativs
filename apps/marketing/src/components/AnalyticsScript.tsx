"use client";

import { useEffect } from "react";

export default function AnalyticsScript() {
  useEffect(() => {
    // Generate visitor ID
    let vid = localStorage.getItem("xc_visitor_id");
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("xc_visitor_id", vid);
    }
    // Generate session ID
    let sid = sessionStorage.getItem("xc_session_id");
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      sessionStorage.setItem("xc_session_id", sid);
    }

    function track(ev: string, path?: string, meta?: Record<string, unknown>) {
      fetch("/api/v1/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: ev,
          visitor_id: vid,
          page_path: path || location.pathname,
          session_id: sid,
          referrer: document.referrer,
          metadata: meta || {},
        }),
        keepalive: true,
      }).catch(() => {});
    }

    // Track initial page view
    track("page_view");

    // Track conversion clicks
    const clickHandler = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("a, button");
      if (t) {
        const href = t.getAttribute("href") || "";
        if (
          href.startsWith("/tools/") ||
          href.startsWith("/diagnostics") ||
          href.includes("rfp")
        ) {
          track("conversion_click", location.pathname, {
            element: t.tagName.toLowerCase(),
            href,
          });
        }
      }
    };
    document.addEventListener("click", clickHandler);

    // Service worker: register only in production. In development a caching SW
    // serves stale chunks and causes hard-reload loops with HMR, so proactively
    // unregister any existing worker and clear its caches.
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      }
    }

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }, []);

  return null;
}
