"use client";

import React, { useState, useMemo, useCallback } from "react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarEvent, expandEvents } from "@/lib/calendar/expand-events";
import { useApp } from "@/lib/store/app-context";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Zap,
  CheckCircle2,
  ListTodo,
  RepeatIcon,
} from "lucide-react";

type CalendarView = "week" | "month";

/** Get start of week for the view range */
function getViewRange(
  date: Date,
  view: CalendarView
): { start: Date; end: Date } {
  if (view === "week") {
    const dow = date.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const start = new Date(date);
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
}

export default function CalendarPage() {
  const { tasks, domains, openTaskInspector, toggleTaskComplete } = useApp();
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Compute view range
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getViewRange(currentDate, view),
    [currentDate, view]
  );

  // Expand all tasks into calendar events for the visible range
  const events = useMemo(
    () => expandEvents(tasks, domains, rangeStart, rangeEnd),
    [tasks, domains, rangeStart, rangeEnd]
  );

  // Stats for the current view range
  const totalXp = events
    .filter((e) => !e.isCompleted)
    .reduce((sum, e) => sum + e.xpReward, 0);
  const completedCount = events.filter((e) => e.isCompleted).length;
  const totalCount = events.length;
  const repeatingCount = new Set(
    tasks.filter((t) => t.repeatConfig).map((t) => t.id)
  ).size;

  // Navigate prev/next
  const handleNavigate = useCallback(
    (direction: -1 | 1) => {
      setCurrentDate((prev) => {
        const d = new Date(prev);
        if (view === "week") {
          d.setDate(d.getDate() + direction * 7);
        } else {
          d.setMonth(d.getMonth() + direction);
        }
        return d;
      });
    },
    [view]
  );

  // Open task inspector when event is clicked
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      const task = tasks.find((t) => t.id === event.taskId);
      if (task) {
        openTaskInspector(task);
      }
    },
    [tasks, openTaskInspector]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarDays size={22} className="text-secondary" />
            <h1 className="text-3xl font-bold tracking-tight text-white font-hanken">
              Schedule
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-semibold">
              LIVE
            </span>
          </div>
          <p className="text-xs font-mono text-outline mt-1">
            All skills, routines, and one-off events expanded from your active
            schedules.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-charcoal-surface border border-white/10 rounded">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 text-xs font-mono rounded capitalize transition-colors cursor-pointer",
                view === v
                  ? "bg-secondary text-obsidian-deep font-bold shadow-[0_0_10px_rgba(173,198,255,0.25)]"
                  : "text-outline hover:text-white"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-charcoal-surface border border-white/10 rounded px-4 py-3 flex items-center gap-3">
          <Zap size={16} className="text-hobbies-orange shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Available XP
            </div>
            <div className="text-lg font-bold font-mono text-hobbies-orange">
              +{totalXp.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-charcoal-surface border border-white/10 rounded px-4 py-3 flex items-center gap-3">
          <ListTodo size={16} className="text-secondary shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Events this {view}
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {totalCount}
            </div>
          </div>
        </div>

        <div className="bg-charcoal-surface border border-white/10 rounded px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-wellness-emerald shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Completed
            </div>
            <div className="text-lg font-bold font-mono text-wellness-emerald">
              {completedCount}
              <span className="text-sm text-outline font-normal ml-1">
                / {totalCount}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-charcoal-surface border border-white/10 rounded px-4 py-3 flex items-center gap-3">
          <RepeatIcon size={16} className="text-learning-violet shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
              Recurring Skills
            </div>
            <div className="text-lg font-bold font-mono text-learning-violet">
              {repeatingCount}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-surface-container-lowest border border-white/8 rounded-lg p-4">
        <CalendarGrid
          view={view}
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onToggleComplete={toggleTaskComplete}
          onNavigate={handleNavigate}
          onToday={() => setCurrentDate(new Date())}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
          Domains:
        </span>
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: d.accentColor }}
            />
            <span className="text-[11px] font-mono text-on-surface-variant">
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
