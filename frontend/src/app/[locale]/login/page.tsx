"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("sso_error");
    if (err) setError(`Single sign-on failed: ${err}`);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload: any = { email, password };
    if (mfaRequired && mfaCode) {
      payload.mfa_code = mfaCode;
    }

    try {
      const res = await api.login(payload);
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push(`/${locale}/portal`);
    } catch (err: any) {
      const msg = err.message || "Login failed";
      if (msg === "mfa_required") {
        setMfaRequired(true);
        setError("Enter the 6-digit code from your authenticator app.");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gravity text-foundation flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-2">XCreativs Portal</h1>
        <p className="text-white/50 mb-8">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={mfaRequired}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={mfaRequired}
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mfaRequired && (
            <div>
              <label className="block text-sm font-medium mb-1">Authenticator Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
                placeholder="000000"
              />
            </div>
          )}

          {error && (
            <p className={`text-sm ${error === "Enter the 6-digit code from your authenticator app." ? "text-signal" : "text-red-400"}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in..." : mfaRequired ? "Verify & Sign In" : "Sign In"}
          </button>

          {mfaRequired && (
            <button
              type="button"
              onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}
              className="w-full text-sm text-white/50 hover:text-white transition-colors"
            >
              Back to email & password
            </button>
          )}
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${API_URL}/api/v1/auth/oauth/google/login`}
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Google
            </a>
            <a
              href={`${API_URL}/api/v1/auth/oauth/microsoft/login`}
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Microsoft
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
