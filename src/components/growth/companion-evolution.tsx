"use client";

import React from "react";
import { Sparkles, Shield, Zap, Award } from "lucide-react";
import { getDomainAvatarEmoji } from "@/lib/avatar-utils";
import { useApp } from "@/lib/store/app-context";
import { getAllCompanionsEvolutionData, type CompanionEvolutionData } from "@/lib/growth-analytics";

function CompanionCard({ companion, isPrimary }: { companion: CompanionEvolutionData; isPrimary: boolean }) {
  const cardClass = isPrimary 
    ? "bg-surface-container-lowest/80 border border-wellness-emerald/30 p-5 relative overflow-hidden flex flex-col items-center text-center space-y-4"
    : "bg-charcoal-surface/50 border border-white/5 p-4 rounded-xl flex flex-col items-center text-center space-y-3";

  return (
    <div className={cardClass}>
      {/* Companion Avatar */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2 ${isPrimary 
        ? "bg-wellness-emerald/10 border-2 border-wellness-emerald shadow-[0_0_25px_rgba(16,185,129,0.3)]" 
        : "bg-surface-container-low border border-white/10"
      }`}>
        {getDomainAvatarEmoji(companion.species)}
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold text-white tracking-tight">{companion.species}</h4>
        <div className="text-xs font-mono text-outline">
          {companion.name} · Lv. {companion.level}
        </div>
        {isPrimary && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30">
            Active Slot
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-outline">
          <span>Evolution Progress</span>
          <span className="text-white font-semibold">
            {companion.progress.toFixed(0)}% ({companion.currentXp.toLocaleString()} / {companion.nextThreshold.toLocaleString()} XP)
          </span>
        </div>
        <div className="w-full bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${companion.progress}%`, 
              backgroundColor: companion.color,
              boxShadow: `0 0 8px ${companion.color}`,
            }}
          />
        </div>
        <p className="text-[10px] font-mono text-outline text-center">
          {companion.xpNeeded} XP needed for next evolution
        </p>
      </div>

      {/* XP earned this period */}
      <div className="w-full pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-mono">
        <span className="text-outline">XP this period:</span>
        <span className="font-bold" style={{ color: companion.color }}>
          +{companion.xpInPeriod.toLocaleString()}
        </span>
        <Zap size={10} style={{ color: companion.color }} />
      </div>
    </div>
  );
}

export function CompanionEvolution() {
  const { domains, tasks, focusSessions } = useApp();
  const allCompanions = getAllCompanionsEvolutionData(focusSessions, tasks, domains);

  if (allCompanions.length === 0) {
    return (
      <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-6">
        <p className="text-xs text-outline font-mono text-center">No domain data available.</p>
      </div>
    );
  }

  // Sort by level descending, then by current XP
  const sortedCompanions = [...allCompanions].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.currentXp - a.currentXp;
  });

  const primaryCompanion = sortedCompanions[0];
  const otherCompanions = sortedCompanions.slice(1);

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-outline">
          Companion Evolution
        </span>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30">
          {allCompanions.length} Active
        </span>
      </div>

      {/* Primary Companion - Full Card */}
      <CompanionCard companion={primaryCompanion} isPrimary={true} />

      {/* Other Companions - Grid */}
      {otherCompanions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">
              Other Companions
            </span>
            <span className="font-mono text-[11px] text-outline">
              {otherCompanions.length} companions
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherCompanions.map((companion) => (
              <CompanionCard key={companion.name} companion={companion} isPrimary={false} />
            ))}
          </div>
        </div>
      )}

      {/* Active Domain Perks - only for primary */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-outline block">
          Active Domain Perks ({primaryCompanion.name})
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
    </div>
  );
}