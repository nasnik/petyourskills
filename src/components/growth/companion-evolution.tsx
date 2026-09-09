"use client";

import React from "react";
import { Sparkles, Shield, Zap, Award } from "lucide-react";

export function CompanionEvolution() {
  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-outline">
          Companion Evolution
        </span>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30">
          Active Slot
        </span>
      </div>

      {/* Evolution Card */}
      <div className="bg-surface-container-lowest/80 border border-wellness-emerald/30 rounded p-5 relative overflow-hidden flex flex-col items-center text-center">
        {/* Glowing Wolf Avatar */}
        <div className="w-24 h-24 rounded-full bg-wellness-emerald/10 border-2 border-wellness-emerald flex items-center justify-center text-4xl mb-4 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
          🐺
        </div>

        <h4 className="text-lg font-bold text-white tracking-tight">
          Vitality Wolf
        </h4>
        <div className="text-xs font-mono text-wellness-emerald mt-1">
          Lv. 15 → Lv. 16
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2 mt-4">
          <div className="flex justify-between text-xs font-mono text-outline">
            <span>Evolution Progress</span>
            <span className="text-white font-semibold">85% (3,400 / 4,000 XP)</span>
          </div>
          <div className="w-full bg-obsidian-deep h-2 rounded-full overflow-hidden">
            <div
              className="bg-wellness-emerald h-full rounded-full transition-all duration-500"
              style={{ width: "85%", boxShadow: "0 0 12px rgba(16,185,129,0.6)" }}
            />
          </div>
          <p className="text-[11px] font-mono text-outline mt-2 text-center">
            600 XP needed to unlock <span className="text-white font-semibold">&apos;Alpha Radiance&apos;</span> form
          </p>
        </div>
      </div>

      {/* Active Domain Perks */}
      <div className="space-y-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-outline block">
          Active Domain Perks
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded bg-obsidian-deep border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-outline block">Endurance Buff</span>
            <span className="text-xs font-mono font-bold text-wellness-emerald flex items-center gap-1">
              <Zap size={12} />
              +15% Focus
            </span>
          </div>

          <div className="p-3 rounded bg-obsidian-deep border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-outline block">Recovery Pulse</span>
            <span className="text-xs font-mono font-bold text-work-electric-blue flex items-center gap-1">
              <Shield size={12} />
              Rest Max
            </span>
          </div>
        </div>
      </div>

      {/* Reserve Guardian */}
      <div className="p-3 rounded bg-surface-container-low border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-learning-violet/20 border border-learning-violet/40 flex items-center justify-center text-sm">
            🦉
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Cyber Owl</div>
            <div className="text-[10px] font-mono text-outline">Reserve Guardian</div>
          </div>
        </div>
        <span className="text-xs font-mono text-outline bg-obsidian-deep px-2 py-0.5 rounded">
          Lv. 24
        </span>
      </div>
    </div>
  );
}
