"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2, Plus, Calendar, CalendarDays, Layers, RotateCcw, Play, Layers as LayersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFriendlyDate } from "@/components/shared/skill-schedule-config";
import { TaskItem } from "@/types";
import { getTodayString } from "@/lib/schedule-utils";
import { getDomainAvatarEmoji } from "@/lib/avatar-utils";

function getScheduleBadge(task: TaskItem) {
  const rc = task.repeatConfig;
  const engine = task.planningEngineType || rc?.engine;

  if (engine === "SPECIFIC_DATE" || rc?.specificDate) {
    return {
      Icon: Calendar,
      text: rc?.specificDate ? formatFriendlyDate(rc.specificDate) : "One-off",
      isEvent: true,
    };
  }
  if (engine === "CUSTOM_SCHEDULE" || rc?.days || rc?.customDates) {
    if (rc?.scheduleType === "custom_dates" && rc.customDates?.length) {
      return {
        Icon: CalendarDays,
        text: `${rc.customDates.length} Dates`,
        isEvent: false,
      };
    }
    if (rc?.scheduleType === "weekdays") {
      return { Icon: CalendarDays, text: "Weekdays", isEvent: false };
    }
    if (rc?.scheduleType === "weekends") {
      return { Icon: CalendarDays, text: "Weekends", isEvent: false };
    }
    if (rc?.days && rc.days.length > 0) {
      return {
        Icon: CalendarDays,
        text: rc.days.length === 7 ? "Every Day" : rc.days.join(", "),
        isEvent: false,
      };
    }
    return { Icon: CalendarDays, text: "Schedule", isEvent: false };
  }
  if (engine === "MULTI_TASK" || rc?.startDate) {
    if (rc?.startDate && rc?.endDate) {
      const startParts = rc.startDate.split("-");
      const endParts = rc.endDate.split("-");
      return {
        Icon: LayersIcon,
        text: `${startParts[1]}/${startParts[2]} - ${endParts[1]}/${endParts[2]}`,
        isEvent: false,
      };
    }
    return { Icon: LayersIcon, text: "Project Sprint", isEvent: false };
  }
  return { Icon: RotateCcw, text: "Daily", isEvent: false };
}

function getEngineLabel(task: TaskItem): string {
  const rc = task.repeatConfig;
  const engine = task.planningEngineType || rc?.engine;
  
  switch (engine) {
    case "DAILY_ROUTINE":
      return "Daily";
    case "MULTI_TASK":
      return "Project";
    case "CUSTOM_SCHEDULE":
      return "Schedule";
    case "SPECIFIC_DATE":
      return "One-off";
    default:
      return "Daily";
  }
}

function getEngineIcon(engine?: string) {
  switch (engine) {
    case "MULTI_TASK":
      return LayersIcon;
    case "CUSTOM_SCHEDULE":
      return CalendarDays;
    case "SPECIFIC_DATE":
      return Calendar;
    default:
      return RotateCcw;
  }
}

function isMultiTaskProject(task: TaskItem): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  const engine = task.planningEngineType || rc?.engine;
  return engine === "MULTI_TASK" || rc?.frequency === "multi_task";
}

function isDailyRoutine(task: TaskItem): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  return rc?.engine === "DAILY_ROUTINE" || rc?.frequency === "daily";
}

export function QuestList() {
  const { tasks, domains, toggleTaskComplete, openTaskInspector, openCreateTaskModal, openFocusModal } = useApp();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // Get tasks that should appear in daily view:
  // 1. Daily routine tasks (always)
  // 2. Multi-task projects (as "work on project today" items)
  // 3. Custom schedule tasks due today
  // 4. Specific date tasks due today
  const dailyTasks = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayString();
    
    return tasks.filter((task) => {
      // Daily routine always shows
      if (isDailyRoutine(task)) return true;
      
      // Multi-task project shows as "work on project today"
      if (isMultiTaskProject(task)) return true;
      
      // Custom schedule - check if due today
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
      
      if (engine === "SPECIFIC_DATE" || frequency === "specific_date") {
        return rc?.specificDate === todayStr;
      }
      
      return false;
    });
  }, [tasks]);

  const filteredTasks = dailyTasks.filter((task) => {
    if (filter === "PENDING") return !task.isCompleted;
    if (filter === "COMPLETED") return task.isCompleted;
    return true;
  });

  const pendingCount = dailyTasks.filter((t) => !t.isCompleted).length;
  const completedCount = dailyTasks.filter((t) => t.isCompleted).length;
  const multiTaskCount = dailyTasks.filter(isMultiTaskProject).length;
  const dailyRoutineCount = dailyTasks.filter(isDailyRoutine).length;

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight font-hanken">
            Today&apos;s Quests
          </h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-on-surface-variant">
            {dailyTasks.length} Today ({dailyRoutineCount} Daily + {multiTaskCount} Projects)
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Completion Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-charcoal-surface border border-white/10 rounded">
            <button
              onClick={() => setFilter("ALL")}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer",
                filter === "ALL"
                  ? "bg-white text-obsidian-deep font-semibold"
                  : "text-outline hover:text-white"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer",
                filter === "PENDING"
                  ? "bg-white text-obsidian-deep font-semibold"
                  : "text-outline hover:text-white"
              )}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={cn(
                "px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer",
                filter === "COMPLETED"
                  ? "bg-white text-obsidian-deep font-semibold"
                  : "text-outline hover:text-white"
              )}
            >
              Completed ({completedCount})
            </button>
          </div>

          <button
            id="add-quest-header-btn"
            onClick={() => openCreateTaskModal()}
            className="h-8 px-3.5 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 hover:bg-wellness-emerald/30 text-wellness-emerald font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
          >
            <Plus size={14} />
            <span>Add Quest</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-outline font-mono text-xs border border-dashed border-white/10 rounded flex flex-col items-center justify-center gap-3">
            <span>No quests for today.</span>
            <button
              onClick={() => openCreateTaskModal()}
              className="px-3.5 py-1.5 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 hover:bg-wellness-emerald/30 text-wellness-emerald text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add a new quest</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const domain =
              domains.find((d) => d.id === task.domainId) || domains[0];

            const rc = task.repeatConfig;
            const engine = task.planningEngineType || rc?.engine;
            const EngineIcon = getEngineIcon(engine);
            const isProject = isMultiTaskProject(task);

            return (
              <div
                key={task.id}
                onClick={() => openTaskInspector(task)}
                className={cn(
                  "p-4 rounded border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer",
                  task.isCompleted
                    ? "bg-charcoal-surface/40 border-white/5 opacity-80"
                    : "bg-charcoal-surface border-white/10 hover:border-white/25 hover:bg-surface-container"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Checkbox
                    checked={task.isCompleted}
                    color={domain?.accentColor || "#10B981"}
                    size="md"
                    onChange={() => toggleTaskComplete(task.id)}
                  />

                  <div className="min-w-0">
                    <h4
                      className={cn(
                        "text-sm font-semibold text-white truncate flex items-center gap-2",
                        task.isCompleted && "line-through text-outline"
                      )}
                    >
                      <span className="text-lg shrink-0" aria-hidden="true">
                        {getDomainAvatarEmoji(domain?.avatarSpecies)}
                      </span>
                      {task.title}
                      {isProject && (
                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
                          Project
                        </span>
                      )}
                    </h4>

                    <div className="flex items-center gap-2 text-xs font-mono text-outline mt-1">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: domain?.accentColor || "#10B981" }}
                        />
                        <span style={{ color: domain?.accentColor || "#10B981" }}>
                          {domain?.name}
                        </span>
                      </span>

                      <span>•</span>

                      {/* Engine Badge */}
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border",
                          engine === "MULTI_TASK"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold"
                            : engine === "CUSTOM_SCHEDULE"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                            : engine === "SPECIFIC_DATE"
                            ? "bg-amber-400/10 border-amber-400/30 text-amber-300 font-semibold"
                            : "bg-white/5 border-white/10 text-outline"
                        )}
                      >
                        <EngineIcon size={10} />
                        <span className="truncate max-w-[100px]">{getEngineLabel(task)}</span>
                      </span>

                      {/* Schedule Badge */}
                      {(() => {
                        const badge = getScheduleBadge(task);
                        const BadgeIcon = badge.Icon;
                        return (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border",
                              badge.isEvent
                                ? "bg-amber-400/10 border-amber-400/30 text-amber-300 font-semibold"
                                : "bg-white/5 border-white/10 text-outline"
                            )}
                          >
                            <BadgeIcon size={10} />
                            <span className="truncate max-w-[140px]">{badge.text}</span>
                          </span>
                        );
                      })()}

                      <span>•</span>

                      {task.isCompleted ? (
                        <span className="text-wellness-emerald flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-outline">
                          <Clock size={11} />
                          {task.estimatedMinutes
                            ? `${task.estimatedMinutes}m Focus`
                            : isProject
                            ? "Work on project"
                            : "Daily Routine"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="font-mono text-xs px-2.5 py-1 rounded font-semibold shrink-0 border"
                  style={{
                    color: domain?.accentColor || "#10B981",
                    backgroundColor: `${domain?.accentColor || "#10B981"}15`,
                    borderColor: `${domain?.accentColor || "#10B981"}33`,
                  }}
                >
                  +{task.xpReward} XP
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFocusModal(task);
                  }}
                  className="p-1 rounded text-wellness-emerald hover:bg-wellness-emerald/15 transition-all cursor-pointer shrink-0"
                  title="Focus on this quest"
                >
                  <Play size={13} className="fill-wellness-emerald" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
