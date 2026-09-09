"use client";

import React from "react";
import { useApp } from "@/lib/store/app-context";
import { formatXP } from "@/lib/utils";
import { Award } from "lucide-react";

export function UserRankBadge() {
  const { user } = useApp();

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-3.5 relative overflow-hidden">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5 text-on-surface-variant font-mono">
          <Award size={14} className="text-wellness-emerald" />
          <span className="font-semibold uppercase tracking-wider">
            RANK: {user.rankTitle.toUpperCase()}
          </span>
        </div>
        <span className="font-mono text-wellness-emerald font-semibold">
          {user.tierProgress}%
        </span>
      </div>

      <div className="text-xs text-white font-medium mb-2 font-mono">
        Level {user.rankTier * 10 + 2} · {user.rankTitle} Tier II
      </div>

      {/* Progress Track */}
      <div className="w-full bg-obsidian-deep h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className="bg-wellness-emerald h-full transition-all duration-500 rounded-full"
          style={{
            width: `${user.tierProgress}%`,
            boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
          }}
        />
      </div>

      <div className="flex justify-between text-[11px] font-mono text-outline">
        <span>To Next Rank</span>
        <span>
          {formatXP(user.totalXp)} / {formatXP(user.nextTierXp)} XP
        </span>
      </div>
    </div>
  );
}
