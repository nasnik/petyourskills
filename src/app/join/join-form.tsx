"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  KeyRound,
  Shield,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Users,
  CheckCircle2,
} from "lucide-react";
import { isValidPassCodeFormat } from "@/lib/collaboration";
import { joinProjectWithPasskeyAction } from "@/actions/collaboration";

const AVATAR_OPTIONS = [
  { emoji: "🐺", name: "Vitality Wolf", desc: "Relentless & fierce" },
  { emoji: "🦊", name: "Byte Fox", desc: "Sharp & resourceful" },
  { emoji: "🦉", name: "Wisdom Owl", desc: "Calm & insightful" },
  { emoji: "🐉", name: "Hydro Dragon", desc: "Powerful & bold" },
  { emoji: "🐢", name: "Aegis Turtle", desc: "Steady & resilient" },
  { emoji: "🐆", name: "Zenith Panther", desc: "Swift & adaptive" },
  { emoji: "🥚", name: "Mystery Egg", desc: "Unwritten potential" },
];

export function JoinForm({
  initialCode,
  initialName = "",
}: {
  initialCode: string;
  initialName?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState(initialName);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showAvatarPicker = name.trim().length >= 1 && isValidPassCodeFormat(code);

  React.useEffect(() => {
    if (!name) {
      try {
        const saved = localStorage.getItem("pys_guest_name");
        if (saved) setName(saved);
      } catch {}
    }
    try {
      const savedAvatar = localStorage.getItem("pys_guest_avatar");
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    } catch {}
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your name so your team knows who is commenting and updating tasks.");
      return;
    }
    if (!isValidPassCodeFormat(code)) {
      setError("Enter a valid project passkey (e.g. CYS-8941).");
      return;
    }
    if (!selectedAvatar) {
      setError("Please choose your companion avatar before joining.");
      return;
    }

    setLoading(true);
    try {
      const result = await joinProjectWithPasskeyAction(code, cleanName, selectedAvatar);
      if (result.success) {
        try {
          localStorage.setItem("pys_guest_name", cleanName);
          localStorage.setItem("pys_guest_avatar", selectedAvatar);
        } catch {}
        router.push("/dashboard");
        router.refresh();
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
          <span className="font-bold text-sm tracking-tight text-white">Pet Your Skills</span>
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
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-wellness-emerald to-transparent" />

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-wellness-emerald/15 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Join Shared Project</h1>
              <p className="text-[11px] font-mono text-outline">PASSKEY ACCESS · COLLABORATOR IDENTITY</p>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed mb-6 mt-3">
            Enter your name, project passkey, and choose your companion avatar to open the shared Kanban workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="guest-name" className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1.5 flex items-center justify-between">
                <span>Your Name / Call Sign</span>
                <span className="text-wellness-emerald text-[9px] font-bold">REQUIRED</span>
              </label>
              <input
                id="guest-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex M. or Morgan"
                autoFocus={!!initialCode}
                autoComplete="name"
                maxLength={50}
                className="w-full h-11 px-3.5 rounded bg-obsidian-deep border border-white/15 focus:border-wellness-emerald/60 focus:ring-1 focus:ring-wellness-emerald/40 outline-none font-mono text-sm text-white placeholder:text-white/20 transition-all"
              />
              <p className="mt-1 text-[10px] font-mono text-outline">
                This name will appear on all your task comments and activity.
              </p>
            </div>

            {/* Passkey */}
            <div>
              <label htmlFor="passcode" className="block text-[10px] font-mono uppercase tracking-wider text-outline mb-1.5 flex items-center justify-between">
                <span>Project Passkey</span>
                <span className="text-outline text-[9px]">FROM HOST</span>
              </label>
              <input
                id="passcode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CYS-8941"
                autoFocus={!initialCode}
                autoComplete="off"
                spellCheck={false}
                className="w-full h-12 px-4 rounded bg-obsidian-deep border border-white/15 focus:border-wellness-emerald/60 focus:ring-1 focus:ring-wellness-emerald/40 outline-none text-center font-mono text-lg font-bold tracking-[0.3em] text-wellness-emerald placeholder:text-white/20 placeholder:font-normal transition-all"
              />
            </div>

            {/* Avatar Picker */}
            {showAvatarPicker && (
              <div className="rounded-xl border border-white/10 bg-obsidian-deep/80 p-4 space-y-3 avatar-picker-enter">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-outline">Choose Your Companion</p>
                  <span className="text-wellness-emerald text-[9px] font-mono font-bold">REQUIRED</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = selectedAvatar === av.emoji;
                    return (
                      <button
                        key={av.emoji}
                        type="button"
                        id={`avatar-${av.name.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setSelectedAvatar(av.emoji)}
                        title={`${av.name}  ${av.desc}`}
                        className="relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                          borderColor: isSelected ? "rgba(16,185,129,0.55)" : "rgba(255,255,255,0.08)",
                          boxShadow: isSelected ? "0 0 16px rgba(16,185,129,0.22)" : "none",
                          transform: isSelected ? "scale(1.06)" : "scale(1)",
                        }}
                      >
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-wellness-emerald flex items-center justify-center">
                            <CheckCircle2 size={10} className="text-obsidian-deep" />
                          </span>
                        )}
                        <span
                          className="text-2xl leading-none"
                          style={{
                            filter: isSelected ? "drop-shadow(0 0 6px rgba(16,185,129,0.5))" : "none",
                            transform: isSelected ? "scale(1.15)" : "scale(1)",
                            transition: "transform 0.15s ease, filter 0.15s ease",
                          }}
                        >
                          {av.emoji}
                        </span>
                        <span className="text-[8px] font-mono text-outline text-center leading-tight truncate w-full text-center">
                          {av.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                  {/* Placeholder slot to complete the 4-col grid */}
                  <div className="p-2.5 rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-20">
                    <span className="text-2xl leading-none">?</span>
                  </div>
                </div>

                {selectedAvatar && (
                  <p className="text-[10px] font-mono text-wellness-emerald text-center animate-in fade-in duration-200">
                    <span className="font-bold">{AVATAR_OPTIONS.find((a) => a.emoji === selectedAvatar)?.name}</span>
                    {"  "}
                    {AVATAR_OPTIONS.find((a) => a.emoji === selectedAvatar)?.desc}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-[11px] font-mono text-danger-red flex items-center gap-1.5 bg-danger-red/10 border border-danger-red/20 p-2.5 rounded">
                <Shield size={12} className="shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length === 0 || name.trim().length === 0 || !selectedAvatar}
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
              track your own skills? You can create a free account anytime 
              the shared project carries over.
            </p>
          </div>

          <div className="text-center pt-4">
            <Link href="/sign-in" className="text-xs font-mono text-outline hover:text-white">
              Already have an account?{" "}
              <span className="text-wellness-emerald font-semibold">Sign in instead ?</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-2 text-xs font-mono text-outline">
        <ShieldCheck size={14} className="text-wellness-emerald" />
        <span>Zero-Knowledge Scoped Access  Anti-Exploit Sync</span>
      </footer>

      <style>{`
        .avatar-picker-enter {
          animation: avatarPickerSlideIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes avatarPickerSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
