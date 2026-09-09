"use client";

import React from "react";
import { Activity, Briefcase, BookOpen } from "lucide-react";

interface DomainProgress {
  name: string;
  species: string;
  hours: number;
  tasksDone: number;
  tasksTotal: number;
  percentage: number;
  yieldXp: number;
  color: string;
  icon: React.ElementType;
}

const DOMAINS_PROGRESS: DomainProgress[] = [
  {
    name: "Health & Wellness",
    species: "Vitality Wolf",
    hours: 14,
    tasksDone: 18,
    tasksTotal: 20,
    percentage: 90,
    yieldXp: 1400,
    color: "#10B981",
    icon: Activity,
  },
  {
    name: "Work & Projects",
    species: "Byte Fox",
    hours: 16,
    tasksDone: 24,
    tasksTotal: 25,
    percentage: 96,
    yieldXp: 1800,
    color: "#3B82F6",
    icon: Briefcase,
  },
  {
    name: "Learning & Growth",
    species: "Hydro Dragon",
    hours: 6,
    tasksDone: 8,
    tasksTotal: 10,
    percentage: 80,
    yieldXp: 850,
    color: "#8B5CF6",
    icon: BookOpen,
  },
];

export function DomainProgressList() {
  return (
    <div className="bg-charcoal-surface border border-white/10 rounded p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-tight">
          Domain Goal Progress & Yield
        </h3>
        <span className="text-xs font-mono text-outline">
          Week 36 (Current)
        </span>
      </div>

      <div className="space-y-4">
        {DOMAINS_PROGRESS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
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
                    {item.name}
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
