import { TaskItem } from "@/types";

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function isSameDay(date1: Date | string | null | undefined, date2: Date): boolean {
  if (!date1) return false;
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  return (
    d1.getFullYear() === date2.getFullYear() &&
    d1.getMonth() === date2.getMonth() &&
    d1.getDate() === date2.getDate()
  );
}

export function isTaskDueToday(task: TaskItem, today: Date = new Date()): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string; days?: string[]; specificDate?: string; scheduleType?: string; customDates?: string[]; startDate?: string; endDate?: string } | null;
  const engine = task.planningEngineType || rc?.engine;
  const frequency = rc?.frequency;

  if (!rc) {
    return false;
  }

  if (engine === "DAILY_ROUTINE" || frequency === "daily") {
    return true;
  }

  if (engine === "SPECIFIC_DATE" || frequency === "specific_date") {
    if (rc.specificDate) {
      return isSameDay(rc.specificDate, today);
    }
    return false;
  }

  if (engine === "CUSTOM_SCHEDULE" || frequency === "custom") {
    const scheduleType = rc.scheduleType;
    const todayStr = getTodayString();
    const todayDay = today.getDay();

    const dayMap: Record<string, number> = {
      M: 1, T: 2, W: 3, Th: 4, F: 5, Sat: 6, Sun: 0,
    };

    if (scheduleType === "weekdays") {
      return todayDay >= 1 && todayDay <= 5;
    }
    if (scheduleType === "weekends") {
      return todayDay === 0 || todayDay === 6;
    }
    if (scheduleType === "days_of_week" && rc.days && rc.days.length > 0) {
      return rc.days.some((d) => dayMap[d] === todayDay);
    }
    if (scheduleType === "custom_dates" && rc.customDates && rc.customDates.length > 0) {
      return rc.customDates.includes(todayStr);
    }
    return false;
  }

  if (engine === "MULTI_TASK" || frequency === "multi_task") {
    if (rc.startDate && rc.endDate) {
      const start = new Date(rc.startDate);
      const end = new Date(rc.endDate);
      return today >= start && today <= end;
    }
    return false;
  }

  return false;
}

export function getTasksDueToday(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => isTaskDueToday(task, today));
}

export function getDailyRoutineTasks(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => {
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    return (rc?.engine === "DAILY_ROUTINE" || rc?.frequency === "daily") && isTaskDueToday(task, today);
  });
}

export function getMultiTaskSubtasksDueToday(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => {
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    const engine = task.planningEngineType || rc?.engine;
    return (engine === "MULTI_TASK" || rc?.frequency === "multi_task") && isTaskDueToday(task, today);
  });
}

export function getCustomScheduleTasksDueToday(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => {
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    const engine = task.planningEngineType || rc?.engine;
    return (engine === "CUSTOM_SCHEDULE" || rc?.frequency === "custom") && isTaskDueToday(task, today);
  });
}

export function getSpecificDateTasksDueToday(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => {
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    const engine = task.planningEngineType || rc?.engine;
    return (engine === "SPECIFIC_DATE" || rc?.frequency === "specific_date") && isTaskDueToday(task, today);
  });
}

export function getAllTasksDueToday(tasks: TaskItem[]): TaskItem[] {
  const today = new Date();
  return tasks.filter((task) => isTaskDueToday(task, today));
}

export interface DailyCompletionStats {
  totalDue: number;
  completed: number;
  pending: number;
  completionRate: number;
  dailyRoutine: { total: number; completed: number };
  multiTask: { total: number; completed: number };
  customSchedule: { total: number; completed: number };
  specificDate: { total: number; completed: number };
}

export function calculateDailyCompletionStats(tasks: TaskItem[]): DailyCompletionStats {
  const today = new Date();
  const allDue = getAllTasksDueToday(tasks);
  const completed = allDue.filter((t) => t.isCompleted);
  const pending = allDue.filter((t) => !t.isCompleted);

  const dailyRoutine = getDailyRoutineTasks(tasks);
  const multiTask = getMultiTaskSubtasksDueToday(tasks);
  const customSchedule = getCustomScheduleTasksDueToday(tasks);
  const specificDate = getSpecificDateTasksDueToday(tasks);

  return {
    totalDue: allDue.length,
    completed: completed.length,
    pending: pending.length,
    completionRate: allDue.length > 0 ? Math.round((completed.length / allDue.length) * 100) : 100,
    dailyRoutine: {
      total: dailyRoutine.length,
      completed: dailyRoutine.filter((t) => t.isCompleted).length,
    },
    multiTask: {
      total: multiTask.length,
      completed: multiTask.filter((t) => t.isCompleted).length,
    },
    customSchedule: {
      total: customSchedule.length,
      completed: customSchedule.filter((t) => t.isCompleted).length,
    },
    specificDate: {
      total: specificDate.length,
      completed: specificDate.filter((t) => t.isCompleted).length,
    },
  };
}