"use client";

import React, { useState, useMemo } from "react";
import { FocusHoursChart } from "@/components/growth/focus-hours-chart";
import { DomainProgressList } from "@/components/growth/domain-progress-list";
import { CompanionEvolutionHorizontal } from "@/components/growth/companion-evolution";
import { ProjectTimeStats } from "@/components/growth/project-time-stats";
import { useApp } from "@/lib/store/app-context";
import { Clock, CheckCircle, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterSessionsByTimeframe,
  calculateTotalFocusTime,
  formatDuration,
  calculateCompletedTasks,
  calculateTaskCompletionRate,
  calculateTotalXP,
  calculateStreak,
  getPreviousTimeframeRange,
  type Timeframe,
} from "@/lib/growth-analytics";

export default function GrowthPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Week");
  const { focusSessions, tasks } = useApp();

  // Calculate KPI metrics based on timeframe
  const kpiMetrics = useMemo(() => {
    const filtered = filterSessionsByTimeframe(focusSessions, timeframe);
    const totalSeconds = calculateTotalFocusTime(filtered);
    const completedTasks = calculateCompletedTasks(filtered, tasks, timeframe);
    const completionRate = calculateTaskCompletionRate(filtered, tasks, timeframe);
    const totalXP = calculateTotalXP(filtered);
    const streak = calculateStreak(focusSessions, tasks);

    // Previous period comparison using calendar day boundaries
    const { start: prevStart, end: prevEnd } = getPreviousTimeframeRange(timeframe);
    const prevSessions = focusSessions.filter(s => {
      const t = new Date(s.completedAt).getTime();
      return t >= prevStart.getTime() && t <= prevEnd.getTime();
    });
    const prevTotalSeconds = calculateTotalFocusTime(prevSessions);
    const prevChange = prevTotalSeconds > 0 
      ? Math.round(((totalSeconds - prevTotalSeconds) / prevTotalSeconds) * 100)
      : 0;

    return {
      totalFocusTime: formatDuration(totalSeconds),
      focusTimeChange: prevChange,
      completedTasks,
      completionRate,
      totalXP,
      streak,
    };
  }, [focusSessions, tasks, timeframe]);

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
              {kpiMetrics.totalFocusTime}
            </span>
            <span className={cn(
              "text-xs font-mono font-semibold",
              kpiMetrics.focusTimeChange >= 0 ? "text-wellness-emerald" : "text-red-400"
            )}>
              {kpiMetrics.focusTimeChange >= 0 ? "↑" : "↓"} {Math.abs(kpiMetrics.focusTimeChange)}%
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            vs {formatDuration(
              calculateTotalFocusTime(
                focusSessions.filter(s => {
                  const t = new Date(s.completedAt).getTime();
                  const { start: prevStart, end: prevEnd } = getPreviousTimeframeRange(timeframe);
                  return t >= prevStart.getTime() && t <= prevEnd.getTime();
                })
              )
            )} previous period
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
              {kpiMetrics.completedTasks} Completed
            </span>
            <span className="text-xs font-mono text-work-electric-blue font-semibold">
              {kpiMetrics.completionRate}% Rate
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            {kpiMetrics.completedTasks} tasks completed in this period
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
              +{kpiMetrics.totalXP.toLocaleString()} XP
            </span>
            <span className="text-xs font-mono text-outline">
              Leveling Soon
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            Generated from focus sessions
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
              {kpiMetrics.streak} Days Active
            </span>
            <span className="text-xs font-mono text-outline">
              Best: 24d
            </span>
          </div>
          <p className="text-[11px] font-mono text-outline">
            {kpiMetrics.streak > 0 ? "Keep it going!" : "Start a new streak today"}
          </p>
        </div>
      </div>

      {/* Companion Evolution Horizontal */}
      <CompanionEvolutionHorizontal />

      {/* Main Analytics Layout */}
      <div className="space-y-6">
        <FocusHoursChart timeframe={timeframe} />
        <DomainProgressList timeframe={timeframe} />
      </div>

      {/* Project & Skill Time Breakdown */}
      <ProjectTimeStats timeframe={timeframe} />
    </div>
  );
}
