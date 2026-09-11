"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeDomainItem, TaskItem } from "@/types";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Layers, Trash2, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { expandEvents, toDateStr } from "@/lib/calendar/expand-events";

interface DomainAccordionProps {
  domain: LifeDomainItem;
  tasks: TaskItem[];
  today: Date;
  isOpen: boolean;
  onToggle: () => void;
}

export function DomainAccordion({
  domain,
  tasks,
  today,
  isOpen,
  onToggle,
}: DomainAccordionProps) {
  const router = useRouter();
  const {
    user,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    openTaskInspector,
    activeProjectId,
    setActiveProjectId,
  } = useApp();
  const isGuest = !!user.isAnonymous;

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
    task?: TaskItem;
    isRecurring: boolean;
  } | null>(null);

  const domainLetter = domain.name.charAt(0);

  // Use the calendar expand engine to find which tasks are scheduled for today
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  const eventsToday = expandEvents(tasks, [domain], todayStart, todayEnd);
  const taskIdsToday = new Set(eventsToday.map((e) => e.taskId));

  // Multi-Task Projects under this domain — shown if they span today
  const petProjects = (domain.skillPets || [])
    .filter((p) => p.planningEngineType === "MULTI_TASK")
    .map((p) => ({
      id: p.id,
      title: p.title,
    }));

  const taskProjects = tasks
    .filter(
      (t) =>
        t.domainId === domain.id &&
        taskIdsToday.has(t.id) &&
        (t.planningEngineType === "MULTI_TASK" ||
          (t.repeatConfig as { engine?: string })?.engine === "MULTI_TASK")
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
    }));

  // Deduplicate by title or id
  const multiTaskProjects = [
    ...petProjects,
    ...taskProjects.filter(
      (tp) =>
        !petProjects.some(
          (pp) => pp.title.toLowerCase() === tp.title.toLowerCase() || pp.id === tp.id
        )
    ),
  ];

  // Daily / Standalone tasks — only those scheduled for today
  const regularTasks = tasks.filter(
    (t) =>
      t.domainId === domain.id &&
      !t.boardId &&
      taskIdsToday.has(t.id) &&
      t.planningEngineType !== "MULTI_TASK" &&
      (t.repeatConfig as { engine?: string })?.engine !== "MULTI_TASK" &&
      !multiTaskProjects.some((p) => p.id === t.id)
  );

  const handleDeleteTodayOnly = () => {
    if (!pendingDelete) return;
    const todayKey = toDateStr(today);

    if (pendingDelete.task) {
      const currentExcluded = pendingDelete.task.repeatConfig?.excludedDates || [];
      const newExcluded = Array.from(new Set([...currentExcluded, todayKey]));
      updateTask({
        id: pendingDelete.task.id,
        repeatConfig: {
          ...(pendingDelete.task.repeatConfig || {}),
          excludedDates: newExcluded,
        },
      });
    } else {
      deleteTask(pendingDelete.id);
    }

    setPendingDelete(null);
  };

  const handleDeleteAll = () => {
    if (!pendingDelete) return;
    deleteTask(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition-all duration-200 overflow-hidden",
          isOpen
            ? "bg-charcoal-surface/70 border-white/20"
            : "bg-surface-container-lowest/40 border-white/5 hover:border-white/10"
        )}
      >
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0"
              style={{
                backgroundColor: `${domain.accentColor}22`,
                color: domain.accentColor,
                border: `1px solid ${domain.accentColor}44`,
              }}
            >
              {domainLetter}
            </div>
            <div className="min-w-0 truncate">
              <div className="text-sm font-semibold text-white truncate">
                {domain.name}
              </div>
              <div className="text-[11px] font-mono text-outline truncate">
                {domain.avatarSpecies} · Lv. {domain.level}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: domain.accentColor,
                boxShadow: `0 0 6px ${domain.accentColor}`,
              }}
            />
            <ChevronDown
              size={16}
              className={cn(
                "text-outline transition-transform duration-200",
                isOpen && "rotate-180 text-white"
              )}
            />
          </div>
        </button>

        {/* Accordion Content */}
        {isOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2.5">
            {/* Multi-Task Projects Section */}
            {multiTaskProjects.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-outline px-1 flex items-center gap-1 font-semibold">
                  <Layers size={11} />
                  <span>Multi-Task Projects</span>
                </div>

                {multiTaskProjects.map((proj) => {
                  const isActive = activeProjectId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setActiveProjectId(proj.id);
                        router.push("/dashboard");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all border text-left cursor-pointer",
                        isActive
                          ? "bg-white/10 border-white text-white font-semibold shadow-md ring-1 ring-white/20"
                          : "bg-obsidian-deep/80 border-white/10 text-on-surface hover:border-white/25 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: domain.accentColor }}
                        />
                        <span className="truncate font-medium">{proj.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1 shrink-0"
                          style={{
                            backgroundColor: `${domain.accentColor}20`,
                            color: domain.accentColor,
                            border: `1px solid ${domain.accentColor}40`,
                          }}
                        >
                          <Layers size={10} />
                          <span>Kanban</span>
                        </span>
                        {!isGuest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const taskObj = tasks.find((t) => t.id === proj.id);
                              setPendingDelete({
                                id: proj.id,
                                title: proj.title,
                                task: taskObj,
                                isRecurring: true,
                              });
                            }}
                            className="p-1 rounded text-outline hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                            title="Delete project"
                            aria-label={`Delete ${proj.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Regular Tasks / Habits List */}
            <div className="space-y-1.5 pt-1">
              {regularTasks.length === 0 && multiTaskProjects.length === 0 ? (
                <div className="text-[11px] font-mono text-outline text-center py-2">
                  Nothing scheduled for today.
                </div>
              ) : (
                regularTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openTaskInspector(task)}
                    className={cn(
                      "flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition-all border cursor-pointer",
                      task.isCompleted
                        ? "bg-obsidian-deep/60 border-white/5 text-outline"
                        : "bg-obsidian-deep border-white/10 text-on-surface hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        checked={task.isCompleted}
                        color={domain.accentColor}
                        size="sm"
                        onChange={() => toggleTaskComplete(task.id)}
                      />
                      <span
                        className={cn(
                          "truncate font-medium",
                          task.isCompleted && "line-through text-outline"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                        style={{
                          color: domain.accentColor,
                          backgroundColor: `${domain.accentColor}15`,
                        }}
                      >
                        +{task.xpReward} XP
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isRecurring = Boolean(
                            task.repeatConfig?.frequency &&
                            task.repeatConfig.frequency !== "specific_date"
                          );
                          setPendingDelete({
                            id: task.id,
                            title: task.title,
                            task,
                            isRecurring,
                          });
                        }}
                        className="p-1 rounded text-outline hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                        title="Delete skill / event"
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-deep/80 backdrop-blur-sm animate-in fade-in-10 duration-200"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-md bg-charcoal-surface border border-white/15 rounded-xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Skill / Event
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  How would you like to delete <span className="text-white font-semibold">&ldquo;{pendingDelete.title}&rdquo;</span>?
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteTodayOnly}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-outline group-hover:text-white shrink-0">
                  <CalendarX size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">
                    Delete for Today Only
                  </div>
                  <div className="text-[11px] text-outline mt-0.5">
                    Remove this event for today ({today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}). Future events stay scheduled.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDeleteAll}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/40 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-300">
                    Delete All Scheduled Events
                  </div>
                  <div className="text-[11px] text-red-200/70 mt-0.5">
                    Permanently remove this skill/event and all occurrences.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-outline hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
