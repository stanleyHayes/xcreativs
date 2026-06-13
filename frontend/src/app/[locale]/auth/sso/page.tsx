"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

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
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    api
      .me()
      .then((u) => localStorage.setItem("user", JSON.stringify(u)))
      .catch(() => {})
      .finally(() => router.replace(`/${locale}/portal`));
  }, [locale, router]);

  return (
    <main className="min-h-screen bg-gravity text-foundation flex items-center justify-center">
      <p className="text-white/60">{error || "Signing you in…"}</p>
    </main>
  );
}
