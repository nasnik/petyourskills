"use client";

import React, { useMemo } from "react";
import { useApp } from "@/lib/store/app-context";
import { CheckCircle2, AlertCircle, Clock, Layers, RotateCcw, Calendar, CalendarDays, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskItem } from "@/types";
import { getTodayString } from "@/lib/schedule-utils";

function isMultiTaskProject(task: TaskItem): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  const engine = task.planningEngineType || rc?.engine;
  return engine === "MULTI_TASK" || rc?.frequency === "multi_task";
}

function isDailyRoutine(task: TaskItem): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  return rc?.engine === "DAILY_ROUTINE" || rc?.frequency === "daily";
}

function isCustomScheduleDueToday(task: TaskItem, today: Date, todayStr: string): boolean {
  const rc = task.repeatConfig as { 
    engine?: string; 
    frequency?: string; 
    days?: string[]; 
    specificDate?: string; 
    scheduleType?: string; 
    customDates?: string[]; 
  } | null;
  const engine = task.planningEngineType || rc?.engine;
  const frequency = rc?.frequency;

  if (engine === "CUSTOM_SCHEDULE" || frequency === "custom") {
    const scheduleType = rc?.scheduleType;
    const todayDay = today.getDay();
    const dayMap: Record<string, number> = { M: 1, T: 2, W: 3, Th: 4, F: 5, Sat: 6, Sun: 0 };
    
    if (scheduleType === "weekdays") return todayDay >= 1 && todayDay <= 5;
    if (scheduleType === "weekends") return todayDay === 0 || todayDay === 6;
    if (scheduleType === "days_of_week" && rc?.days?.length) {
      return rc.days.some((d) => dayMap[d] === todayDay);
    }
    if (scheduleType === "custom_dates" && rc?.customDates?.length) {
      return rc.customDates.includes(todayStr);
    }
  }
  return false;
}

function isSpecificDateDueToday(task: TaskItem, todayStr: string): boolean {
  const rc = task.repeatConfig as { 
    engine?: string; 
    frequency?: string; 
    specificDate?: string; 
  } | null;
  const engine = task.planningEngineType || rc?.engine;
  const frequency = rc?.frequency;

  if (engine === "SPECIFIC_DATE" || frequency === "specific_date") {
    return rc?.specificDate === todayStr;
  }
  return false;
}

function getEngineConfig(task: TaskItem) {
  const rc = task.repeatConfig;
  const engine = task.planningEngineType || rc?.engine;
  const frequency = rc?.frequency;

  switch (engine) {
    case "DAILY_ROUTINE":
      return { label: "Daily Routines", icon: RotateCcw, color: "#10B981", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" };
    case "MULTI_TASK":
      return { label: "Projects", icon: Layers, color: "#8B5CF6", bg: "bg-purple-500/10 border-purple-500/30 text-purple-300" };
    case "CUSTOM_SCHEDULE":
      return { label: "Scheduled", icon: CalendarDays, color: "#3B82F6", bg: "bg-blue-500/10 border-blue-500/30 text-blue-300" };
    case "SPECIFIC_DATE":
      return { label: "One-off", icon: Calendar, color: "#F59E0B", bg: "bg-amber-400/10 border-amber-400/30 text-amber-300" };
    default:
      return { label: "Daily", icon: RotateCcw, color: "#10B981", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" };
  }
}

interface CategoryStats {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  total: number;
  completed: number;
  color: string;
  bgClass: string;
}

export function DailyCompletionSummary() {
  const { tasks, domains } = useApp();

  const today = new Date();
  const todayStr = getTodayString();

  // Calculate stats for each category
  const categoryStats = useMemo((): CategoryStats[] => {
    const dailyRoutineTasks = tasks.filter(isDailyRoutine);
    const multiTaskProjects = tasks.filter(isMultiTaskProject);
    const customScheduleTasks = tasks.filter((t) => isCustomScheduleDueToday(t, today, todayStr));
    const specificDateTasks = tasks.filter((t) => isSpecificDateDueToday(t, todayStr));

    return [
      {
        label: "Daily Routines",
        icon: RotateCcw,
        total: dailyRoutineTasks.length,
        completed: dailyRoutineTasks.filter((t) => t.isCompleted).length,
        color: "#10B981",
        bgClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
      },
      {
        label: "Projects",
        icon: Layers,
        total: multiTaskProjects.length,
        completed: multiTaskProjects.filter((t) => t.isCompleted).length,
        color: "#8B5CF6",
        bgClass: "bg-purple-500/10 border-purple-500/30 text-purple-300",
      },
      {
        label: "Scheduled",
        icon: CalendarDays,
        total: customScheduleTasks.length,
        completed: customScheduleTasks.filter((t) => t.isCompleted).length,
        color: "#3B82F6",
        bgClass: "bg-blue-500/10 border-blue-500/30 text-blue-300",
      },
      {
        label: "One-off",
        icon: Calendar,
        total: specificDateTasks.length,
        completed: specificDateTasks.filter((t) => t.isCompleted).length,
        color: "#F59E0B",
        bgClass: "bg-amber-400/10 border-amber-400/30 text-amber-300",
      },
    ];
  }, [tasks]);

  // Only show categories that have tasks
  const activeCategories = categoryStats.filter((c) => c.total > 0);

  if (activeCategories.length === 0) return null;

  const totalDue = activeCategories.reduce((sum, c) => sum + c.total, 0);
  const totalCompleted = activeCategories.reduce((sum, c) => sum + c.completed, 0);
  const completionRate = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 100;
  const allDone = totalDue > 0 && totalCompleted === totalDue;

  return (
    <div className="rounded-xl border bg-charcoal-surface/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xl border",
              allDone
                ? "bg-wellness-emerald/20 border-wellness-emerald/40 text-wellness-emerald"
                : "bg-white/5 border-white/10 text-outline"
            )}
          >
            {allDone ? (
              <CheckCircle2 size={20} className="fill-current" />
            ) : (
              <Clock size={20} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-hanken">
              Daily Completion
            </h3>
            <p className="text-xs font-mono text-outline">
              {allDone ? "All caught up!" : `${totalCompleted} of ${totalDue} completed`}
            </p>
          </div>
        </div>

        {/* Overall Progress Ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={allDone ? "#10B981" : "#8B5CF6"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={175.93}
              strokeDashoffset={175.93 * (1 - completionRate / 100)}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold font-mono text-white">
              {completionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activeCategories.map((cat) => {
          const rate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 100;
          const isComplete = cat.total > 0 && cat.completed === cat.total;

          return (
            <div
              key={cat.label}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isComplete
                  ? "bg-wellness-emerald/5 border-wellness-emerald/20"
                  : "bg-surface-container-lowest/50 border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center gap-1",
                    cat.bgClass
                  )}
                >
                  <span style={{ color: "currentColor" }}><cat.icon size={10} /></span>
                  {cat.label}
                </span>
                <span className={cn("text-xs font-mono font-bold", isComplete ? "text-wellness-emerald" : "text-white")}>
                  {cat.completed}/{cat.total}
                </span>
              </div>

              <div className="w-full bg-obsidian-deep h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: isComplete ? "#10B981" : cat.color,
                    boxShadow: `0 0 6px ${isComplete ? "#10B981" : cat.color}`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
                <span className={isComplete ? "text-wellness-emerald" : "text-outline"}>
                  {rate}% complete
                </span>
                {isComplete && (
                  <span className="text-wellness-emerald flex items-center gap-0.5">
                    <CheckCircle2 size={10} style={{ color: "currentColor" }} />
                    Done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Message */}
      <div
        className={cn(
          "p-3 rounded-lg text-xs font-mono flex items-center gap-2",
          allDone
            ? "bg-wellness-emerald/10 border border-wellness-emerald/30 text-wellness-emerald"
            : "bg-amber-400/10 border border-amber-400/30 text-amber-300"
        )}
      >
        {allDone ? (
          <>
            <CheckCircle2 size={13} className="fill-current shrink-0" style={{ color: "currentColor" }} />
            <span>Excellent! You&apos;ve completed everything scheduled for today.</span>
          </>
        ) : (
          <>
            <AlertCircle size={13} className="shrink-0" style={{ color: "currentColor" }} />
            <span>
              {totalDue - totalCompleted} quest{totalDue - totalCompleted === 1 ? "" : "s"} remaining.{" "}
              <span className="font-semibold">Keep going!</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}