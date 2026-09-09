"use client";

import React, { useState } from "react";
import { FocusHoursChart } from "@/components/growth/focus-hours-chart";
import { DomainProgressList } from "@/components/growth/domain-progress-list";
import { CompanionEvolution } from "@/components/growth/companion-evolution";
import { Clock, CheckCircle, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GrowthPage() {
  const [timeframe, setTimeframe] = useState<"Day" | "Week" | "Month" | "Year">("Week");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-white font-hanken">
              Growth & Accomplishments
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30 font-semibold">
              SYNCED
            </span>
          </div>
          <p className="text-xs font-mono text-outline mt-1">
            Track time dedication, habit consistency, and avatar evolution milestones across domains.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 p-1 bg-charcoal-surface border border-white/10 rounded">
          {(["Day", "Week", "Month", "Year"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer",
                timeframe === t
                  ? "bg-wellness-emerald text-obsidian-deep font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "text-outline hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <div className="bg-charcoal-surface border border-white/10 rounded p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-outline">
            <span>TOTAL FOCUS TIME</span>
            <Clock size={14} className="text-wellness-emerald" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              38h 45m
            </span>
            <span className="text-xs font-mono text-wellness-emerald font-semibold">
              ↑ +14%
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            vs 33h 10m previous 7 days
          </p>
        </div>

        {/* Tasks Accomplished */}
        <div className="bg-charcoal-surface border border-white/10 rounded p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-outline">
            <span>TASKS ACCOMPLISHED</span>
            <CheckCircle size={14} className="text-work-electric-blue" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              64 Completed
            </span>
            <span className="text-xs font-mono text-work-electric-blue font-semibold">
              92% Rate
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            +8 tasks completed above quota
          </p>
        </div>

        {/* XP Generated */}
        <div className="bg-charcoal-surface border border-white/10 rounded p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-outline">
            <span>XP GENERATED</span>
            <Zap size={14} className="text-learning-violet" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono text-learning-violet">
              +4,850 XP
            </span>
            <span className="text-xs font-mono text-outline">
              Leveling Soon
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            Vitality Wolf & Hydro Dragon active
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-charcoal-surface border border-white/10 rounded p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-outline">
            <span>CURRENT STREAK</span>
            <Flame size={14} className="text-hobbies-orange" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-hobbies-orange font-mono">
              18 Days Active
            </span>
            <span className="text-xs font-mono text-outline">
              Best: 24d
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            6 days remaining to set record
          </p>
        </div>
      </div>

      {/* Main Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <FocusHoursChart />
          <DomainProgressList />
        </div>

        <div className="lg:col-span-1">
          <CompanionEvolution />
        </div>
      </div>
    </div>
  );
}
