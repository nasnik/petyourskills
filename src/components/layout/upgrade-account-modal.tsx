"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store/app-context";
import {
  X,
  Sparkles,
  PawPrint,
  FolderKanban,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

/**
 * Friendly explainer shown when an anonymous guest tries to add personal
 * skills. Guests keep scoped access to the shared project; personal skill
 * tracking requires a full account.
 */
export function UpgradeAccountModal() {
  const router = useRouter();
  const { isUpgradeModalOpen, closeUpgradeModal } = useApp();

  if (!isUpgradeModalOpen) return null;

  const handleSignUp = () => {
    closeUpgradeModal();
    router.push("/sign-up");
  };

  const benefits = [
    {
      icon: PawPrint,
      text: "Track personal skills & habits with your own companion pets",
    },
    {
      icon: TrendingUp,
      text: "Unlock growth analytics, focus sessions, and rank progression",
    },
    {
      icon: FolderKanban,
      text: "Keep access to this shared project — it carries over automatically",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-deep/80 backdrop-blur-md animate-in fade-in-20 duration-200"
      onClick={closeUpgradeModal}
    >
      <div
        className="w-full max-w-md bg-charcoal-surface border border-white/10 rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 text-outline hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-wellness-emerald mb-1">
          <Sparkles size={18} />
          <h3 className="font-bold text-white text-base">
            Unlock Your Personal Skill Tracker
          </h3>
        </div>
        <p className="text-xs text-outline font-mono mb-5">
          You&apos;re collaborating as an anonymous guest.
        </p>

        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
          Create a full account to track your personal skills, customize
          companions, and build your own life domains — while keeping access
          to this shared project.
        </p>

        <div className="space-y-2.5 mb-6">
          {benefits.map((b) => (
            <div
              key={b.text}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-obsidian-deep/70 border border-white/5"
            >
              <div className="w-7 h-7 rounded bg-wellness-emerald/15 border border-wellness-emerald/30 flex items-center justify-center text-wellness-emerald shrink-0">
                <b.icon size={14} />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                {b.text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignUp}
            className="flex-1 h-10 rounded-lg bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98] cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={closeUpgradeModal}
            className="h-10 px-4 rounded-lg border border-white/10 text-outline hover:text-white hover:bg-white/5 text-xs font-mono transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
