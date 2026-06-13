"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Shield, CheckCircle, Copy } from "lucide-react";
import type { AuthUser, MFAEnrollmentResponse } from "@/lib/types";

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  return JSON.parse(stored) as AuthUser;
}

export default function MFAPage() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [enrollment, setEnrollment] = useState<MFAEnrollmentResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.enrollMFA();
      setEnrollment(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll MFA");
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setLoading(true);
    setError("");
    try {
      await api.verifyMFA({ secret: enrollment.secret, code });
      setSuccess("MFA enabled successfully. You will be required to enter a code on next login.");
      setEnrollment(null);
      setCode("");
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as AuthUser;
        u.mfa_enabled = true;
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
      <p className="text-white/50 mb-8">
        Add an extra layer of security to your account with TOTP-based two-factor authentication.
      </p>

      {user?.mfa_enabled ? (
        <div className="flex items-center gap-3 p-4 bg-signal/10 border border-signal/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-signal" />
          <div>
            <p className="font-medium text-signal">MFA is enabled</p>
            <p className="text-sm text-white/50">Your account is protected with two-factor authentication.</p>
          </div>
        </div>
      ) : (
        <div>
          {!enrollment ? (
            <div className="space-y-4">
              <p className="text-white/60">
                Two-factor authentication is currently disabled. Enroll now to secure your account.
              </p>
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="flex items-center gap-2 bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                {loading ? "Generating..." : "Enable MFA"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-sm font-medium mb-3">1. Scan this QR code with your authenticator app</p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollment.qr_url ?? "")}`}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-sm font-medium mb-2">2. Or enter this secret manually</p>
                <div className="flex items-center gap-2 bg-black/30 rounded px-3 py-2">
                  <code className="text-sm font-mono text-signal flex-1">{enrollment.secret}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(enrollment.secret ?? "")}
                    className="p-1 hover:text-signal transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">3. Enter the 6-digit code from your app</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
                    placeholder="000000"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {success && <p className="text-signal text-sm">{success}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="bg-signal text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEnrollment(null); setCode(""); setError(""); }}
                    className="px-4 py-2 rounded text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
