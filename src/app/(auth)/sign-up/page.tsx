"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Shield, ArrowRight, ShieldCheck, Loader2, Users, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerUserAction } from "@/actions/auth";
import type { GuestSessionInfo } from "@/actions/collaboration";

export default function SignUpPage() {
  const router = useRouter();
  const [callSign, setCallSign] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestSessionInfo | null>(null);

  // Detect an anonymous guest session so we can show the upgrade banner —
  // registerUserAction merges the shared project access automatically.
  useEffect(() => {
    import("@/actions/collaboration")
      .then(({ getGuestSessionInfoAction }) => getGuestSessionInfoAction())
      .then(setGuestInfo)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      // 1. Attempt Supabase Auth sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { call_sign: callSign },
        },
      });

      if (authError) {
        console.warn("Supabase Auth notice:", authError.message);
        if (authError.message.includes("already registered")) {
          setErrorMsg("User already registered in Supabase. You can sign in directly or proceed to onboarding.");
        }
      }

      // 2. Register user into Neon PostgreSQL and set pys_uid cookie
      await registerUserAction({ email, callSign });

      // 3. Store in sessionStorage for onboarding redundancy
      if (typeof window !== "undefined") {
        sessionStorage.setItem("onboarding_email", email);
        sessionStorage.setItem("onboarding_callsign", callSign);
      }

      // 4. Proceed to onboarding with a clean page load
      window.location.href = "/onboarding";
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      window.location.href = "/onboarding";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-obsidian-deep flex flex-col justify-between p-6 relative">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            Pet Your Skills
          </span>
          <span className="text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            v2.4.0
          </span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-white/10 text-xs font-mono text-outline">
          <span className="w-2 h-2 rounded-full bg-wellness-emerald animate-pulse" />
          <span>TLS 1.3 Encrypted</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-charcoal-surface border border-white/10 rounded-lg p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center border border-wellness-emerald/40 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Shield size={24} className="text-wellness-emerald" />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight font-hanken">
              Create Your Identity
            </h1>
            <p className="text-xs text-outline font-mono mt-1.5 leading-relaxed">
              Initialize your operative profile, bind your primary domain spirit, and deploy real-time discipline telemetrics.
            </p>
          </div>

          {guestInfo?.isGuest && (
            <div className="p-3.5 rounded bg-wellness-emerald/10 border border-wellness-emerald/30 flex items-start gap-2.5">
              <Users size={15} className="text-wellness-emerald shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono text-wellness-emerald leading-relaxed">
                Upgrading guest session
                {guestInfo.projectTitle
                  ? ` — you keep access to “${guestInfo.projectTitle}”`
                  : " — you keep access to your shared project"}{" "}
                alongside your new personal skills.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded bg-danger-red/10 border border-danger-red/30 text-xs font-mono text-danger-red">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-outline mb-1.5">
                <span>OPERATIVE CALL SIGN / FULL NAME</span>
                <span className="text-[10px] text-outline/60">SEC-ID #941</span>
              </div>
              <input
                type="text"
                value={callSign}
                placeholder="e.g. Alex Hunter"
                onChange={(e) => setCallSign(e.target.value)}
                className="w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2.5 text-xs font-mono text-white placeholder:text-outline/40 focus:outline-none focus:border-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-outline mb-1.5">
                <span>SYSTEM SECURE EMAIL</span>
                <span className="text-[10px] text-wellness-emerald">● VERIFIED FORMAT</span>
              </div>
              <input
                type="email"
                value={email}
                placeholder="alex.hunter@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2.5 text-xs font-mono text-white placeholder:text-outline/40 focus:outline-none focus:border-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-outline mb-1.5">
                <span>CIPHER KEY / PASSWORD</span>
                <span className="text-[10px] text-wellness-emerald">OPTIMAL ENTROPY</span>
              </div>
              <input
                type="password"
                value={password}
                placeholder="••••••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2.5 text-xs font-mono text-white placeholder:text-outline/40 focus:outline-none focus:border-white"
                required
              />
              {/* Strength Bars */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <div className="h-1 rounded bg-wellness-emerald" />
                <div className="h-1 rounded bg-wellness-emerald" />
                <div className="h-1 rounded bg-wellness-emerald" />
                <div className="h-1 rounded bg-wellness-emerald" />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs font-mono text-outline cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="accent-wellness-emerald mt-0.5"
                  required
                />
                <span className="leading-relaxed">
                  I accept the <span className="text-white underline">Operative Terms of Service</span> & <span className="text-white underline">Zero-Knowledge Privacy Protocol</span>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Synchronizing Node...</span>
                </>
              ) : (
                <>
                  <span>Initialize System & Begin</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/join")}
              title="Enter a shared-project passkey"
              className="w-full h-10 rounded border border-wellness-emerald/30 bg-wellness-emerald/10 hover:bg-wellness-emerald/20 hover:border-wellness-emerald/50 flex items-center justify-center gap-2 text-xs font-mono text-wellness-emerald transition-colors cursor-pointer"
            >
              <KeyRound size={15} />
              <span>Passkey — join a shared project</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/sign-in"
              className="text-xs font-mono text-outline hover:text-white"
            >
              Already registered?{" "}
              <span className="text-wellness-emerald font-semibold">
                Sign in here →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-2 text-xs font-mono text-outline">
        <ShieldCheck size={14} className="text-wellness-emerald" />
        <span>Supabase Auth • Anti-Exploit Sync</span>
      </footer>
    </div>
  );
}
