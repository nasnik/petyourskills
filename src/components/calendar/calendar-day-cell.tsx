"use client";

import React from "react";
import { CalendarEvent } from "@/lib/calendar/expand-events";
import { CalendarEventChip } from "./calendar-event-chip";
import { cn } from "@/lib/utils";

const WEEK_MAX_VISIBLE = 4;
const MONTH_MAX_VISIBLE = 3;

interface CalendarDayCellProps {
  dateStr: string; // YYYY-MM-DD
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean; // false for padding days in month view
  view: "week" | "month";
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarDayCell({
  dateStr,
  events,
  isToday,
  isCurrentMonth,
  view,
  onEventClick,
}: CalendarDayCellProps) {
  const date = new Date(dateStr + "T00:00:00");
  const dayNum = date.getDate();
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

  const maxVisible = view === "week" ? WEEK_MAX_VISIBLE : MONTH_MAX_VISIBLE;
  const visibleEvents = events.slice(0, maxVisible);
  const overflow = events.length - maxVisible;

  const xpTotal = events
    .filter((e) => !e.isCompleted)
    .reduce((sum, e) => sum + e.xpReward, 0);

  if (view === "week") {
    return (
      <div
        className={cn(
          "flex flex-col h-full min-h-[180px] rounded border transition-colors",
          isToday
            ? "border-wellness-emerald/50 bg-wellness-emerald/5 shadow-[0_0_16px_rgba(16,185,129,0.1)]"
            : "border-white/8 bg-charcoal-surface hover:border-white/15"
        )}
      >
        {/* Day header */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 border-b",
            isToday ? "border-wellness-emerald/20" : "border-white/8"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider",
                isToday ? "text-wellness-emerald font-bold" : "text-outline"
              )}
            >
              {dayName}
            </span>
            <span
              className={cn(
                "text-lg font-bold font-hanken leading-none",
                isToday ? "text-wellness-emerald" : "text-white"
              )}
            >
              {dayNum}
            </span>
          </div>

          {/* XP available today */}
          {xpTotal > 0 && (
            <span className="text-[9px] font-mono text-outline px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
              +{xpTotal} XP
            </span>
          )}
        </div>

        {/* Events */}
        <div className="flex-1 p-2 space-y-1 overflow-hidden">
          {events.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <span className="text-[10px] font-mono text-outline/40">
                — Free day —
              </span>
            </div>
          )}

          {visibleEvents.map((ev) => (
            <CalendarEventChip
              key={`${ev.taskId}-${ev.date}`}
              event={ev}
              onClick={onEventClick}
            />
          ))}

          {overflow > 0 && (
            <div className="text-[10px] font-mono text-outline px-2 py-1">
              +{overflow} more
            </div>
          )}
        </div>
      </div>
    );
  }

  // Month view — compact
  return (
    <div
      className={cn(
        "flex flex-col min-h-[90px] rounded border p-1.5 transition-colors",
        isToday
          ? "border-wellness-emerald/40 bg-wellness-emerald/5"
          : isCurrentMonth
          ? "border-white/8 bg-charcoal-surface hover:border-white/15"
          : "border-white/4 bg-surface-container-lowest/50"
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1 px-0.5">
        <span
          className={cn(
            "text-xs font-bold font-mono",
            isToday
              ? "text-wellness-emerald"
              : isCurrentMonth
              ? "text-white"
              : "text-outline/40"
          )}
        >
          {dayNum}
        </span>
        {events.length > 0 && (
          <span className="text-[9px] font-mono text-outline">
            {events.length}
          </span>
        )}
      </div>

      {/* Compact event list */}
      <div className="space-y-0.5">
        {visibleEvents.map((ev) => (
          <CalendarEventChip
            key={`${ev.taskId}-${ev.date}`}
            event={ev}
            onClick={onEventClick}
            compact
          />
        ))}
        {overflow > 0 && (
          <span className="text-[9px] font-mono text-outline px-1.5">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}
