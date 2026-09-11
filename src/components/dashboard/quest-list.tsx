"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2, Plus, Calendar, CalendarDays, Layers, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFriendlyDate } from "@/components/shared/skill-schedule-config";
import { TaskItem } from "@/types";

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
        Icon: Layers,
        text: `${startParts[1]}/${startParts[2]} - ${endParts[1]}/${endParts[2]}`,
        isEvent: false,
      };
    }
    return { Icon: Layers, text: "Project Sprint", isEvent: false };
  }
  return { Icon: RotateCcw, text: "Daily", isEvent: false };
}

export function QuestList() {
  const { tasks, domains, toggleTaskComplete, openTaskInspector, openCreateTaskModal } = useApp();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "PENDING") return !task.isCompleted;
    if (filter === "COMPLETED") return task.isCompleted;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight font-hanken">
            Today&apos;s Quests
          </h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-on-surface-variant">
            {tasks.length} Tasks
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
              All Domains
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
            <span>No quests found under this filter.</span>
            <button
              onClick={() => openCreateTaskModal()}
              className="px-3.5 py-1.5 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 hover:bg-wellness-emerald/30 text-wellness-emerald text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Initialize your first quest</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const domain =
              domains.find((d) => d.id === task.domainId) || domains[0];

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
                        "text-sm font-semibold text-white truncate",
                        task.isCompleted && "line-through text-outline"
                      )}
                    >
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs font-mono text-outline mt-1">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: domain?.accentColor }}
                        />
                        <span style={{ color: domain?.accentColor }}>
                          {domain?.name}
                        </span>
                      </span>

                      <span>•</span>

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
                          Completed 07:30 AM
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-outline">
                          <Clock size={11} />
                          {task.estimatedMinutes
                            ? `${task.estimatedMinutes}m Focus`
                            : "Daily Routine"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="font-mono text-xs px-2.5 py-1 rounded font-semibold shrink-0 border"
                  style={{
                    color: domain?.accentColor,
                    backgroundColor: `${domain?.accentColor}15`,
                    borderColor: `${domain?.accentColor}33`,
                  }}
                >
                  +{task.xpReward} XP
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
