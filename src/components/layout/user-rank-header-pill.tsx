"use client";

import React from "react";
import { useApp } from "@/lib/store/app-context";
import { formatXP } from "@/lib/utils";
import { Award, Zap, Users } from "lucide-react";

export function UserRankHeaderPill() {
  const { user } = useApp();

  if (user.isAnonymous) {
    const displayName =
      user.callSign && user.callSign !== "Guest Collaborator"
        ? `${user.callSign} (Guest)`
        : "Guest Collaborator";

    return (
      <div className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono">
        <Users size={13} className="text-wellness-emerald" />
        <span className="text-outline uppercase tracking-wider text-[10px]">
          STATUS:
        </span>
        <span className="text-white font-semibold">{displayName}</span>
      </div>
    );
  }

  const level = user.rankTier * 10 + 2;

  return (
    <div
      className="hidden sm:flex items-center gap-3 bg-surface-container-lowest px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm"
      title={`${formatXP(user.totalXp)} / ${formatXP(user.nextTierXp)} XP to next rank`}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-wellness-emerald/15 border border-wellness-emerald/30 flex items-center justify-center text-wellness-emerald">
          <Award size={13} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono text-white tracking-wide uppercase">
              {user.rankTitle}
            </span>
            <span className="text-[10px] font-mono text-wellness-emerald font-semibold">
              Lv. {level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini Progress Bar */}
            <div className="w-16 bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-wellness-emerald h-full transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: `${user.tierProgress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-outline">
              {user.tierProgress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
