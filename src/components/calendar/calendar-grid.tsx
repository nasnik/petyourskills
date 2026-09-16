"use client";

import React, { useMemo } from "react";
import { CalendarEvent, groupByDate, toDateStr } from "@/lib/calendar/expand-events";
import { CalendarDayCell } from "./calendar-day-cell";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarGridProps {
  view: "week" | "month";
  currentDate: Date; // anchor date (any day in the week/month to show)
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onToggleComplete?: (taskId: string) => void;
  onNavigate: (direction: -1 | 1) => void;
  onToday: () => void;
}

/** Get Monday of the week containing `d` */
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const dow = date.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Get first day of the month */
function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Get last day of the month */
function getMonthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Build the 7-day week grid [Mon..Sun] */
function buildWeekDates(anchor: Date): Date[] {
  const start = getWeekStart(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Build the 35/42-day month grid (always starting on Monday) */
function buildMonthDates(anchor: Date): Date[] {
  const monthStart = getMonthStart(anchor);
  const monthEnd = getMonthEnd(anchor);
  const gridStart = getWeekStart(monthStart);
  // We need at least enough rows to cover monthEnd
  const dates: Date[] = [];
  const cur = new Date(gridStart);
  // Always 6 rows = 42 cells to avoid layout jumps
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  // Trim trailing rows if the last row is entirely outside the month
  // (keep at least 35 cells = 5 rows)
  while (
    dates.length > 35 &&
    dates[dates.length - 7].getMonth() !== anchor.getMonth()
  ) {
    dates.splice(dates.length - 7, 7);
  }
  return dates;
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0];
  const end = dates[dates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", opts)} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}, ${end.getFullYear()}`;
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function CalendarGrid({
  view,
  currentDate,
  events,
  onEventClick,
  onToggleComplete,
  onNavigate,
  onToday,
}: CalendarGridProps) {
  const todayStr = toDateStr(new Date());
  const eventsByDate = useMemo(() => groupByDate(events), [events]);

  const dates = useMemo(
    () =>
      view === "week"
        ? buildWeekDates(currentDate)
        : buildMonthDates(currentDate),
    [view, currentDate]
  );

  const heading =
    view === "week" ? formatWeekRange(dates) : formatMonth(currentDate);

  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            className="w-8 h-8 rounded border border-white/10 bg-charcoal-surface hover:bg-surface-container flex items-center justify-center text-outline hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-bold text-white font-hanken min-w-[220px] text-center">
            {heading}
          </span>

          <button
            type="button"
            onClick={() => onNavigate(1)}
            className="w-8 h-8 rounded border border-white/10 bg-charcoal-surface hover:bg-surface-container flex items-center justify-center text-outline hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-mono rounded border border-wellness-emerald/40 bg-wellness-emerald/10 text-wellness-emerald hover:bg-wellness-emerald/20 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-mono uppercase tracking-wider text-outline py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div
        className={cn(
          "grid grid-cols-7 gap-1",
          view === "week" ? "grid-rows-1" : "grid-rows-[repeat(auto-fill,minmax(90px,1fr))]"
        )}
      >
        {dates.map((date) => {
          const dateStr = toDateStr(date);
          const cellEvents = eventsByDate.get(dateStr) ?? [];
          const isCurrentMonth = date.getMonth() === currentMonth;

          return (
            <CalendarDayCell
              key={dateStr}
              dateStr={dateStr}
              events={cellEvents}
              isToday={dateStr === todayStr}
              isCurrentMonth={isCurrentMonth}
              view={view}
              onEventClick={onEventClick}
              onToggleComplete={onToggleComplete}
            />
          );
        })}
      </div>
    </div>
  );
}
