"use client";

import { useApp } from "@/lib/store/app-context";
import { getDomainAvatarEmoji } from "@/lib/avatar-utils";

export function DashboardCompanions() {
  const { domains } = useApp();
  
  // Filter to only active domains with avatarSpecies
  const activeCompanions = domains
    .filter((d) => d.isActive && d.avatarSpecies)
    .slice(0, 4); // Limit to 4 companions to avoid overflow

  if (activeCompanions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeCompanions.map((domain) => (
        <div
          key={domain.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-charcoal-surface/60 border border-white/10 hover:border-white/20 transition-all cursor-default"
          title={`${domain.name}: ${domain.currentXp} XP (Level ${domain.level})`}
        >
          <span className="text-lg" aria-hidden="true">
            {getDomainAvatarEmoji(domain.avatarSpecies)}
          </span>
          <div className="hidden sm:block text-left">
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
              {domain.name}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-white">
              <span className="font-mono">{domain.currentXp.toLocaleString("en-US")}</span>
              <span className="text-outline">XP</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-outline">
                Lv.{domain.level}
              </span>
            </div>
          </div>
          <div className="sm:hidden text-left">
            <div className="flex items-center gap-1 text-xs font-bold text-white">
              <span className="font-mono">{domain.currentXp.toLocaleString("en-US")}</span>
              <span className="text-outline">XP</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-outline">
                Lv.{domain.level}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}