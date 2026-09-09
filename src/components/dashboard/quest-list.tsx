"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestList() {
  const { tasks, domains, toggleTaskComplete, openTaskInspector } = useApp();
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
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-outline font-mono text-xs border border-dashed border-white/10 rounded">
            No quests found under this filter.
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
