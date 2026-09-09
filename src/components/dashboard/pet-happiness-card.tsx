"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export function PetHappinessCard() {
  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-4 flex items-center gap-3.5 relative overflow-hidden">
      <div className="w-12 h-12 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Sparkles size={22} className="animate-pulse" />
      </div>

      <div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-outline block mb-0.5">
          Pet Happiness
        </span>
        <div className="text-sm font-semibold text-white leading-snug">
          Vitality Wolf is feeling motivated!
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-white/90 mt-1">
          <span className="text-[#F59E0B] font-semibold">Mood: Radiant</span>
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
        </div>
      </div>
    </div>
  );
}
