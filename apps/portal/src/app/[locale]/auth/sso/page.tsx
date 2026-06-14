"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@xc/api";

export default function SSOCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [error] = useState(() => {
    if (typeof window === "undefined") return "";
    const q = new URLSearchParams(window.location.search);
    if (!q.get("access_token") || !q.get("refresh_token")) {
      return "Missing sign-in tokens. Please try again.";
    }
    return "";
  });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const access = q.get("access_token");
    const refresh = q.get("refresh_token");
    if (!access || !refresh) {
      return;
    }
    // Strip the tokens from the URL + history immediately so they don't linger in
    // browser history or leak via the Referer header on the next navigation.
    // (Full fix: have the OAuth callback hand off via a one-time code / cookie
    // instead of query-string tokens — tracked as a follow-up.)
    window.history.replaceState(null, "", window.location.pathname);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    api
      .me()
      .then((u) => localStorage.setItem("user", JSON.stringify(u)))
      .catch(() => {})
      .finally(() => router.replace(`/${locale}/portal`));
  }, [locale, router]);

  return (
    <main className="shell-x flex min-h-screen items-center justify-center bg-gravity py-20 text-foundation">
      <div className="portal-panel-x max-w-md p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Secure sign-in</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {error ? "Sign-in needs attention" : "Signing you in…"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/60">
          {error || "We are verifying your session and routing you into the portal."}
        </p>
      </div>
    </main>
  );
}
