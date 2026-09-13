"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store/app-context";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  LayoutDashboard,
  TrendingUp,
  CalendarDays,
  Play,
  Settings,
  HelpCircle,
  ShieldCheck,
  Users,
  UserPlus,
  Layers,
  FolderKanban,
  Trash2,
  CalendarX,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { expandEvents, toDateStr } from "@/lib/calendar/expand-events";
import { TaskItem } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    domains,
    tasks,
    openFocusModal,
    openCreateTaskModal,
    openTaskInspector,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    activeProjectId,
    setActiveProjectId,
  } = useApp();

  const isGuest = !!user.isAnonymous;
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);

  const getToday = () => new Date();
  const [today, setToday] = useState<Date>(getToday);

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
    task?: TaskItem;
    isRecurring: boolean;
  } | null>(null);

  // Auto-refresh at midnight so the date ticks over without a page reload
  useEffect(() => {
    const scheduleRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        setToday(new Date());
        timer = scheduleRefresh();
      }, msUntilMidnight);
    };
    let timer = scheduleRefresh();
    return () => clearTimeout(timer);
  }, []);

  const todayStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate today's tasks using the calendar expand engine
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  const eventsToday = expandEvents(tasks, domains, todayStart, todayEnd);
  const taskIdsToday = new Set(eventsToday.map((e) => e.taskId));

  // Multi-Task Projects
  const allProjects = domains.flatMap((d) => {
    const petProjects = (d.skillPets || [])
      .filter((p) => p.planningEngineType === "MULTI_TASK")
      .map((p) => ({
        id: p.id,
        title: p.title,
        domainId: d.id,
        domain: d,
      }));

    const taskProjects = tasks
      .filter(
        (t) =>
          t.domainId === d.id &&
          (t.planningEngineType === "MULTI_TASK" ||
            (t.repeatConfig as { engine?: string })?.engine === "MULTI_TASK")
      )
      .map((t) => ({
        id: t.id,
        title: t.title,
        domainId: d.id,
        domain: d,
      }));

    return [
      ...petProjects,
      ...taskProjects.filter(
        (tp) =>
          !petProjects.some(
            (pp) =>
              pp.title.toLowerCase() === tp.title.toLowerCase() ||
              pp.id === tp.id
          )
      ),
    ];
  });

  // Regular tasks / habits scheduled for today
  const allTodayHabits = tasks.filter((t) => {
    if (t.boardId) return false;
    const isMulti =
      t.planningEngineType === "MULTI_TASK" ||
      (t.repeatConfig as { engine?: string })?.engine === "MULTI_TASK";
    if (isMulti) return false;
    return taskIdsToday.has(t.id);
  });

  // Apply domain filter if selected
  const visibleHabits = selectedDomainFilter
    ? allTodayHabits.filter((t) => t.domainId === selectedDomainFilter)
    : allTodayHabits;

  const visibleProjects = selectedDomainFilter
    ? allProjects.filter((p) => p.domainId === selectedDomainFilter)
    : allProjects;

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

  const navLinks = isGuest
    ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/calendar", label: "Schedule", icon: CalendarDays },
        { href: "/growth", label: "Growth Analytics", icon: TrendingUp },
      ];

  return (
    <>
      <aside className="w-80 h-screen sticky top-0 flex flex-col bg-charcoal-surface/95 border-r border-white/10 shrink-0 select-none overflow-hidden z-20">
        {/* Top Header */}
        <div className="p-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-1">
            <Link
              href="/dashboard"
              onClick={() => setActiveProjectId(null)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded bg-wellness-emerald/20 border border-wellness-emerald/40 flex items-center justify-center text-wellness-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <Sparkles size={16} />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                Pet Your Skills
              </span>
            </Link>
            <span className="text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              v2.4.0
            </span>
          </div>
          <div className="text-xs text-outline font-mono pl-9">{todayStr}</div>
        </div>

        {/* Navigation Routes */}
        <div className="px-4 py-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href &&
              (link.href !== "/dashboard" || activeProjectId === null);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (link.href === "/dashboard") {
                    setActiveProjectId(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-white/10 text-white font-semibold border border-white/15"
                    : "text-on-surface-variant hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-wellness-emerald" : "text-outline"}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Primary Content: Habits & Skills First */}
        <div className="flex-1 px-4 py-2 overflow-y-auto space-y-3.5 scrollbar-thin">
          {/* Section Header with Domain Filter Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-outline px-1">
              {isGuest ? (
                <>
                  <span>Shared Project</span>
                  <Users size={14} className="text-wellness-emerald" />
                </>
              ) : (
                <>
                  <span>Life Domains & Companions</span>
                  <ShieldCheck size={14} className="text-outline" />
                </>
              )}
            </div>

            {/* Quick Domain Filter Chips */}
            {!isGuest && domains.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedDomainFilter(null)}
                  className={cn(
                    "px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer",
                    selectedDomainFilter === null
                      ? "bg-white text-obsidian-deep font-bold border-white"
                      : "bg-surface-container-lowest border-white/10 text-outline hover:text-white"
                  )}
                >
                  All ({allTodayHabits.length})
                </button>
                {domains.map((d) => {
                  const count = allTodayHabits.filter((h) => h.domainId === d.id).length;
                  const isSelected = selectedDomainFilter === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setSelectedDomainFilter(isSelected ? null : d.id)
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                        isSelected
                          ? "bg-white/15 text-white font-bold border-white/30"
                          : "bg-surface-container-lowest border-white/10 text-outline hover:text-white"
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: d.accentColor }}
                      />
                      <span>{d.name}</span>
                      {count > 0 && (
                        <span className="text-[9px] opacity-75">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Habits Section (Seen First) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-outline px-1 font-bold">
              <span>Today&apos;s Focus & Habits</span>
              <span className="text-[10px] text-wellness-emerald font-semibold">
                {visibleHabits.filter((h) => h.isCompleted).length}/{visibleHabits.length} done
              </span>
            </div>

            {visibleHabits.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/5 bg-surface-container-lowest/40 text-center space-y-2">
                <p className="text-xs text-outline font-mono">
                  No habits scheduled for today.
                </p>
                {!isGuest && (
                  <button
                    type="button"
                    onClick={() => openCreateTaskModal()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
                  >
                    <Plus size={13} className="text-wellness-emerald" />
                    <span>Add Habit / Skill</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {visibleHabits.map((task) => {
                  const domain = domains.find((d) => d.id === task.domainId);
                  const accent = domain?.accentColor || "#10B981";

                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskInspector(task)}
                      className={cn(
                        "group flex items-center justify-between gap-2.5 p-2.5 rounded-lg text-xs transition-all border cursor-pointer",
                        task.isCompleted
                          ? "bg-obsidian-deep/50 border-white/5 opacity-60 hover:opacity-100"
                          : "bg-obsidian-deep border-white/10 hover:border-white/25 hover:bg-surface-container-lowest/60 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Checkbox
                          checked={task.isCompleted}
                          color={accent}
                          size="sm"
                          onChange={() => toggleTaskComplete(task.id)}
                        />
                        <div className="min-w-0 flex-1">
                          {/* Primary Habit Title */}
                          <div
                            className={cn(
                              "font-semibold text-white truncate text-xs transition-colors",
                              task.isCompleted && "line-through text-outline"
                            )}
                          >
                            {task.title}
                          </div>
                          {/* Subtle Domain Subtitle Tag */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: accent }}
                            />
                            <span className="text-[10px] font-mono text-outline truncate">
                              {domain?.name || "Habit"}
                            </span>
                          </div>
                        </div>
                      </div>

<div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                            style={{
                              color: accent,
                              backgroundColor: `${accent}15`,
                              border: `1px solid ${accent}30`,
                            }}
                          >
                            +{task.xpReward} XP
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFocusModal(task);
                            }}
                            className="p-1 rounded text-wellness-emerald hover:bg-wellness-emerald/15 transition-all cursor-pointer"
                            title="Focus on this task"
                          >
                            <Play size={13} className="fill-wellness-emerald" />
                          </button>
                          {!isGuest && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete({
                                  id: task.id,
                                  title: task.title,
                                  task,
                                  isRecurring: Boolean(
                                    task.repeatConfig?.frequency &&
                                      task.repeatConfig.frequency !== "specific_date"
                                  ),
                                });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-outline hover:text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                              title="Delete habit"
                              aria-label={`Delete ${task.title}`}
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
          </div>

          {/* Multi-Task Projects Section */}
{visibleProjects.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-outline px-1 flex items-center gap-1.5 font-bold">
                  <Layers size={11} className="text-wellness-emerald" />
                  <span>Multi-Task Projects</span>
                </div>

                <div className="space-y-1.5">
                  {visibleProjects.map((proj) => {
                    const isActive = activeProjectId === proj.id;
                    const projDomain = proj.domain;
                    
                    // Find the associated task to check completion status
                    const projTask = tasks.find((t) => t.id === proj.id || 
                      (t.domainId === proj.domainId && (t.planningEngineType === "MULTI_TASK" || (t.repeatConfig as { engine?: string })?.engine === "MULTI_TASK" && t.title === proj.title))
                    );
                    const isCompleted = projTask?.isCompleted ?? false;
                    const accent = projDomain?.accentColor || "#3B82F6";

                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          router.push("/dashboard");
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all border text-left cursor-pointer",
                          isActive
                            ? "bg-white/10 border-white text-white font-semibold shadow-md ring-1 ring-white/20"
                            : "bg-obsidian-deep border-white/10 hover:border-white/25 hover:bg-surface-container-lowest/60 text-on-surface"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={isCompleted}
                            color={accent}
                            size="sm"
                            onChange={() => {
                              if (projTask) {
                                toggleTaskComplete(projTask.id);
                              }
                            }}
                          />
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs"
                            style={{
                              backgroundColor: `${accent}20`,
                              color: accent,
                              border: `1px solid ${accent}40`,
                            }}
                          >
                            <FolderKanban size={13} />
                          </div>
                          <div className="min-w-0">
                            <div className={cn(
                              "font-semibold text-white truncate text-xs transition-colors",
                              isCompleted && "line-through text-outline"
                            )}>
                              {proj.title}
                            </div>
                            <div className="text-[10px] font-mono text-outline truncate">
                              {projDomain?.name} · Kanban
                            </div>
                          </div>
                        </div>

                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1 shrink-0"
                          style={{
                            backgroundColor: `${accent}20`,
                            color: accent,
                            border: `1px solid ${accent}40`,
                          }}
                        >
                          <Layers size={9} />
                          <span>Board</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFocusModal(projTask || null);
                          }}
                          className="p-1 rounded text-wellness-emerald hover:bg-wellness-emerald/15 transition-all cursor-pointer"
                          title="Focus on this project"
                        >
                          <Play size={13} className="fill-wellness-emerald" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

        {/* Bottom Focus Launcher & Actions */}
        <div className="p-4 pt-2 border-t border-white/10 bg-surface-container-lowest/80 space-y-3">
          {isGuest ? (
            <>
              <Link
                href="/sign-up"
                className="w-full h-11 bg-wellness-emerald hover:bg-wellness-emerald/90 text-obsidian-deep font-semibold text-sm rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-[0.98]"
              >
                <UserPlus size={16} />
                <span>Create Full Account</span>
              </Link>
              <div className="flex items-center justify-center text-[10px] text-outline font-mono pt-1">
                <span>Guest session • Scoped to shared project</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs text-outline font-mono pt-1">
              <Link
                href="/settings"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Settings size={14} />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => alert("Support & Guild telemetrics: online.")}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle size={14} />
                <span>Support</span>
              </button>
            </div>
          )}
        </div>
      </aside>

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
                  Delete Habit / Skill
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
                    Permanently remove this skill/habit and all occurrences.
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
