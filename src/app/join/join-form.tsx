"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  KeyRound,
  Shield,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Users,
} from "lucide-react";
import { isValidPassCodeFormat } from "@/lib/collaboration";
import { joinProjectWithPasskeyAction } from "@/actions/collaboration";

export function JoinForm({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPassCodeFormat(code)) {
      setError("Enter a valid project passkey (e.g. CYS-8941).");
      return;
    }

    setLoading(true);
    try {
      const result = await joinProjectWithPasskeyAction(code);
      if (result.success) {
        // Clean page load so the dashboard layout re-seeds with the
        // anonymous collaborator session scoped to the shared project.
        window.location.href = "/dashboard";
        return;
      }
      setError(result.error || "Unable to join project with this passkey.");
      setLoading(false);
    } catch (err) {
      console.error("Join error:", err);
      setError("Connection issue. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-obsidian-deep flex flex-col justify-between p-6 relative">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <Link href="/sign-in" className="flex items-center gap-2">
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

      {/* Center Join Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-charcoal-surface border border-white/10 rounded-lg p-8 shadow-2xl relative overflow-hidden">
          {/* Glowing accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-wellness-emerald to-transparent" />

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-wellness-emerald/15 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Join Shared Project
              </h1>
              <p className="text-[11px] font-mono text-outline">
                PASSKEY ACCESS • ANONYMOUS COLLABORATOR
              </p>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed mb-6 mt-3">
            Enter the project passkey from your host to open the shared Kanban
            workspace. No account required — you&apos;ll join as an anonymous
            collaborator with access to{" "}
            <span className="text-white font-semibold">only this project</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1.5"
              >
                Project Passkey
              </label>
              <input
                id="passcode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CYS-8941"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="w-full h-12 px-4 rounded bg-obsidian-deep border border-white/15 focus:border-wellness-emerald/60 focus:ring-1 focus:ring-wellness-emerald/40 outline-none text-center font-mono text-lg font-bold tracking-[0.3em] text-wellness-emerald placeholder:text-white/20 placeholder:font-normal transition-all"
              />
              {error && (
                <p className="mt-2 text-[11px] font-mono text-danger-red flex items-center gap-1.5">
                  <Shield size={12} />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length === 0}
              className="w-full h-11 rounded bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Passkey...</span>
                </>
              ) : (
                <>
                  <Users size={15} />
                  <span>Enter Project Workspace</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Scoped access notice */}
          <div className="mt-6 p-3.5 rounded-lg bg-obsidian-deep/90 border border-white/5 text-[11px] font-mono text-outline leading-relaxed space-y-1.5">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-wellness-emerald" />
              <span>Scoped Access Guarantee</span>
            </div>
            <p>
              You will only see the shared project board. The host&apos;s other
              life domains, habits, and companion pets stay private. Want to
              track your own skills? You can create a free account anytime —
              the shared project carries over.
            </p>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/sign-in"
              className="text-xs font-mono text-outline hover:text-white"
            >
              Already have an account?{" "}
              <span className="text-wellness-emerald font-semibold">
                Sign in instead →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-2 text-xs font-mono text-outline">
        <ShieldCheck size={14} className="text-wellness-emerald" />
        <span>Zero-Knowledge Scoped Access • Anti-Exploit Sync</span>
      </footer>
    </div>
  );
}
