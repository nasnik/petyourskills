"use client";

import React from "react";
import { useApp } from "@/lib/store/app-context";
import { Heart } from "lucide-react";

const AVATAR_EMOJIS: Record<string, string> = {
  "Vitality Wolf": "🐺",
  "Byte Fox": "🦊",
  "Wisdom Owl": "🦉",
  "Hydro Dragon": "🐉",
  "Aegis Turtle": "🐢",
  "Zenith Panther": "🐆",
  "Mystery Egg": "🥚",
  "byte-fox": "🦊",
  "wisdom-owl": "🦉",
  "hydro-dragon": "🐉",
  "vitality-wolf": "🐺",
  "aegis-turtle": "🐢",
  "zenith-panther": "🐆",
  "mystery-egg": "🥚",
};

export function ActiveCompanionCard() {
  const { domains } = useApp();
  const activeDomain = domains.find((d) => d.slug === "health") || domains[0] || {
    id: "default",
    name: "Health & Wellness",
    slug: "health",
    accentColor: "#10B981",
    avatarSpecies: "Vitality Wolf",
    level: 1,
    currentXp: 0,
    isActive: true,
  };

  const species = activeDomain.avatarSpecies || "Vitality Wolf";
  const emoji = AVATAR_EMOJIS[species] || "🐾";

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-4 flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-outline">
            Active Companion
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30 font-medium">
            Tier {activeDomain.level}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-wellness-emerald/20 border border-wellness-emerald/50 flex items-center justify-center text-wellness-emerald font-bold text-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            {emoji}
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">
              {species} <span className="text-outline text-xs font-mono font-normal">Lv. {activeDomain.level}</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-pink-400 font-mono mt-0.5">
              <Heart size={12} className="fill-pink-400 text-pink-400" />
              <span>Health: 85%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-mono text-outline mb-1.5">
          <span>XP Progression</span>
          <span>{activeDomain.currentXp} / 4,000 XP</span>
        </div>
        <div className="w-full bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-pink-500 h-full rounded-full transition-all duration-300"
            style={{ width: "60%", boxShadow: "0 0 8px rgba(236,72,153,0.5)" }}
          />
        </div>
      </div>
    </div>
  );
}
