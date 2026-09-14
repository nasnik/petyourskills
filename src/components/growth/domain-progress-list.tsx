"use client";

import React from "react";
import { Activity, Briefcase, BookOpen, Users, Home, Gamepad2 } from "lucide-react";
import { useApp } from "@/lib/store/app-context";
import { getDomainFocusData, type Timeframe } from "@/lib/growth-analytics";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  health: Activity,
  work: Briefcase,
  learning: BookOpen,
  volunteering: Users,
  admin: Home,
  hobbies: Gamepad2,
};

interface DomainProgressListProps {
  timeframe: Timeframe;
}

export function DomainProgressList({ timeframe }: DomainProgressListProps) {
  const { tasks, domains, focusSessions } = useApp();
  const domainData = getDomainFocusData(focusSessions, tasks, domains, timeframe);

  if (domainData.length === 0) {
    return (
      <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            Domain Goal Progress & Yield
          </h3>
          <span className="text-xs font-mono text-outline">
            {timeframe}
          </span>
        </div>
        <p className="text-xs text-outline font-mono text-center py-4">No focus sessions in this timeframe yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-tight">
          Domain Goal Progress & Yield
        </h3>
        <span className="text-xs font-mono text-outline">
          {timeframe}
        </span>
      </div>

      <div className="space-y-4">
        {domainData.map((item) => {
          const Icon = DOMAIN_ICONS[item.domainName.toLowerCase().split(" ")[0]] || Activity;
          return (
            <div
              key={item.domainId}
              className="p-4 rounded border border-white/5 bg-surface-container-lowest/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${item.color}20`,
                    color: item.color,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {item.domainName}
                  </h4>
                  <div className="text-xs font-mono text-outline mt-0.5">
                    {item.hours}h logged · {item.tasksDone}/{item.tasksTotal} tasks ({item.percentage}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress bar */}
                <div className="w-32 bg-obsidian-deep h-1.5 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                  <span
                    className="font-bold"
                    style={{ color: item.color }}
                  >
                    +{item.yieldXp} XP
                  </span>
                  <span className="text-outline px-2 py-0.5 rounded bg-white/5">
                    {item.species}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
