import { TaskItem, LifeDomainItem, SkillRepeatConfig } from "@/types";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  taskId: string;
  title: string;
  domainId: string;
  accentColor: string;
  xpReward: number;
  isCompleted: boolean;
  estimatedMinutes?: number | null;
  time?: string;
}

/** Map short day names → JS getDay() indices (0=Sun) */
const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Format a Date as YYYY-MM-DD in local time */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local-midnight Date */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Returns all dates in [start, end] (inclusive) */
function dateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Does a specific date fall within the range [rangeStart, rangeEnd]? */
function inRange(dateStr: string, rangeStart: Date, rangeEnd: Date): boolean {
  const d = parseDate(dateStr);
  return d >= rangeStart && d <= rangeEnd;
}

/** Check if a recurring task or project occurrence is completed on a specific date */
function isOccurrenceCompleted(task: TaskItem, dateStr: string): boolean {
  if (!task.isCompleted) return false;

  const todayStr = toDateStr(new Date());

  // Never mark future dates completed ahead of time
  if (dateStr > todayStr) return false;

  // If the task/project is marked completed, it indicates work completed today only
  if (dateStr === todayStr) return true;

  // For past dates — do NOT retroactively mark them completed.
  // Marking a task complete signals "I worked on this today", not "all past dates are done".
  // This applies especially to MULTI-TASK / ongoing project spans.
  return false;
}

/**
 * Expand a single task into one CalendarEvent per date it should appear on,
 * within the given [rangeStart, rangeEnd] window.
 */
function expandTask(
  task: TaskItem,
  domain: LifeDomainItem,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  // If this task belongs to a Kanban board (boardId is set) and has no explicit schedule,
  // it lives on the project board, NOT on the calendar schedule.
  if (
    task.boardId &&
    (!task.repeatConfig ||
      (!task.repeatConfig.frequency && !task.repeatConfig.specificDate))
  ) {
    return [];
  }

  const cfg: SkillRepeatConfig | null = task.repeatConfig ?? null;
  const base: Omit<CalendarEvent, "date"> = {
    taskId: task.id,
    title: task.title,
    domainId: task.domainId,
    accentColor: domain.accentColor,
    xpReward: task.xpReward,
    isCompleted: false, // Will be set per occurrence
    estimatedMinutes: task.estimatedMinutes,
    time: cfg?.time as string | undefined,
  };

  const excluded = new Set(cfg?.excludedDates ?? []);

  // No repeat config → one-off on today (if today is in range and not excluded)
  if (!cfg || !cfg.frequency) {
    if (task.boardId) return [];
    const today = toDateStr(new Date());
    if (inRange(today, rangeStart, rangeEnd) && !excluded.has(today)) {
      return [{ ...base, date: today, isCompleted: task.isCompleted }];
    }
    return [];
  }

  const allDates = dateRange(rangeStart, rangeEnd);
  let rawEvents: CalendarEvent[] = [];

  switch (cfg.frequency) {
    case "daily": {
      rawEvents = allDates.map((date) => ({
        ...base,
        date,
        isCompleted: isOccurrenceCompleted(task, date),
      }));
      break;
    }

    case "weekdays": {
      rawEvents = allDates
        .filter((d) => {
          const dow = parseDate(d).getDay();
          return dow >= 1 && dow <= 5; // Mon–Fri
        })
        .map((date) => ({
          ...base,
          date,
          isCompleted: isOccurrenceCompleted(task, date),
        }));
      break;
    }

    case "weekends": {
      rawEvents = allDates
        .filter((d) => {
          const dow = parseDate(d).getDay();
          return dow === 0 || dow === 6; // Sat–Sun
        })
        .map((date) => ({
          ...base,
          date,
          isCompleted: isOccurrenceCompleted(task, date),
        }));
      break;
    }

    case "custom": {
      const allowedDows = (cfg.days ?? []).map(
        (name) => DAY_NAME_TO_INDEX[name] ?? -1
      );
      // Clamp to startDate/endDate if provided
      const cfgStart = cfg.startDate ? parseDate(cfg.startDate) : rangeStart;
      const cfgEnd = cfg.endDate ? parseDate(cfg.endDate) : rangeEnd;
      rawEvents = allDates
        .filter((d) => {
          const parsed = parseDate(d);
          return (
            parsed >= cfgStart &&
            parsed <= cfgEnd &&
            allowedDows.includes(parsed.getDay())
          );
        })
        .map((date) => ({
          ...base,
          date,
          isCompleted: isOccurrenceCompleted(task, date),
        }));
      break;
    }

    case "specific_date": {
      const specificDate = cfg.specificDate as string | undefined;
      if (specificDate && inRange(specificDate, rangeStart, rangeEnd)) {
        rawEvents = [{ ...base, date: specificDate, isCompleted: task.isCompleted }];
      }
      break;
    }

    case "multi_task": {
      const cfgStart = cfg.startDate
        ? parseDate(cfg.startDate)
        : rangeStart;
      const cfgEnd = cfg.endDate ? parseDate(cfg.endDate) : rangeEnd;
      // Show on every day within the project span that falls in view range
      const effectiveStart = cfgStart > rangeStart ? cfgStart : rangeStart;
      const effectiveEnd = cfgEnd < rangeEnd ? cfgEnd : rangeEnd;
      if (effectiveStart <= effectiveEnd) {
        rawEvents = dateRange(effectiveStart, effectiveEnd).map((date) => ({
          ...base,
          date,
          isCompleted: isOccurrenceCompleted(task, date),
        }));
      }
      break;
    }

    default:
      rawEvents = [];
  }

  if (excluded.size > 0) {
    return rawEvents.filter((ev) => !excluded.has(ev.date));
  }

  return rawEvents;
}

/**
 * Main export: given all tasks + their domains, expand into CalendarEvents
 * for the given date range.
 */
export function expandEvents(
  tasks: TaskItem[],
  domains: LifeDomainItem[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const domainMap = new Map(domains.map((d) => [d.id, d]));
  const events: CalendarEvent[] = [];

  for (const task of tasks) {
    const domain = domainMap.get(task.domainId);
    if (!domain) continue;
    events.push(...expandTask(task, domain, rangeStart, rangeEnd));
  }

  // Sort by date then title
  events.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.title.localeCompare(b.title)
  );

  return events;
}

/** Group CalendarEvent[] by date string */
export function groupByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, []);
    map.get(ev.date)!.push(ev);
  }
  return map;
}
