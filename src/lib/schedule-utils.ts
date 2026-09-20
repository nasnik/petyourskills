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

export function isMultiTaskProject(task: TaskItem): boolean {
  if (task.boardId) return false;
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  const engine = task.planningEngineType || rc?.engine;
  return engine === "MULTI_TASK" || rc?.frequency === "multi_task";
}

export function isDailyRoutine(task: TaskItem): boolean {
  if (task.boardId) return false;
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  return rc?.engine === "DAILY_ROUTINE" || rc?.frequency === "daily";
}

/**
 * Returns true if the task is part of the daily recurring plan (daily routine,
 * or multi-task project quest for today).
 */
export function isDailyPlanQuest(task: TaskItem): boolean {
  if (task.boardId) return false;
  return isDailyRoutine(task) || isMultiTaskProject(task);
}

/**
 * Returns true if a task is marked completed for TODAY specifically.
 * If a recurring routine or multi-task project was completed on a previous day,
 * it is not considered completed for today.
 */
export function isCompletedToday(task: TaskItem, today: Date = new Date()): boolean {
  if (!task.isCompleted) return false;
  if (!task.doneAt) {
    // If there's no completion timestamp and it's a daily plan quest, it's stale/unverified
    if (isDailyPlanQuest(task)) return false;
    return task.isCompleted;
  }
  return isSameDay(task.doneAt, today);
}

/**
 * Resolves the root Task associated with a multi-task project entry.
 *
 * A project shown in the sidebar may come from two sources:
 *   1. A **Task** row with `planningEngineType === "MULTI_TASK"` (Task-backed).
 *      Here `project.id === task.id`.
 *   2. A **SkillPet** row with `planningEngineType === "MULTI_TASK"` (SkillPet-backed).
 *      Here `project.id === skillPet.id` which does NOT match any task id.
 *      The associated Task is identified by domainId + MULTI_TASK engine + matching title.
 *
 * DB updates that target Task columns (repeatConfig, xpReward, estimatedMinutes) must
 * use the Task's id. Sending them to the SkillPet id silently drops the changes because
 * the skill_pets table has no repeatConfig column.
 *
 * Returns the matching TaskItem, or null if no associated task is found.
 */
export function resolveMultiTaskProjectTask(
  projectId: string,
  projectTitle: string,
  projectDomainId: string,
  tasks: TaskItem[]
): TaskItem | null {
  // 1. Exact id match — Task-backed project
  const byId = tasks.find((t) => t.id === projectId && !t.boardId);
  if (byId) return byId;

  // 2. Title + domain + MULTI_TASK match — SkillPet-backed project
  const byTitle = tasks.find(
    (t) =>
      !t.boardId &&
      t.domainId === projectDomainId &&
      t.title.toLowerCase() === projectTitle.toLowerCase() &&
      (t.planningEngineType === "MULTI_TASK" ||
        (t.repeatConfig as { engine?: string } | null)?.engine === "MULTI_TASK")
  );
  return byTitle ?? null;
}

export interface MultiTaskProjectSavePlan {
  /** The target task ID where repeatConfig/dates, XP, and duration must be saved */
  targetTaskId: string;
  /** Whether the project is SkillPet-backed (separate pet record vs task record) */
  isSkillPetBacked: boolean;
  /** The updates to apply to the root Task record */
  taskUpdates: {
    title: string;
    xpReward: number;
    estimatedMinutes: number | null;
    repeatConfig: Record<string, unknown>;
  };
  /** If SkillPet-backed, title update for the SkillPet record */
  petUpdates?: {
    title: string;
  };
}

/**
 * Builds the save plan for editing a multi-task project.
 * Handles routing updates to the root Task record vs SkillPet record:
 * - SkillPet rows have NO repeatConfig column, so repeatConfig (including startDate and endDate)
 *   must always be saved to the Task record (`targetTaskId`).
 * - For SkillPet-backed projects, title updates are dispatched to both the pet and task records.
 */
export function buildMultiTaskProjectSavePlan(params: {
  projectId: string;
  taskId: string | null;
  title: string;
  xpReward: number;
  estimatedMinutesStr: string;
  startDate: string;
  endDate: string;
  prevRepeatConfig?: Record<string, unknown> | null;
}): MultiTaskProjectSavePlan {
  const effectiveTaskId = params.taskId ?? params.projectId;
  const isSkillPetBacked = Boolean(params.taskId && params.taskId !== params.projectId);

  const prevRc = params.prevRepeatConfig ?? {};
  const newRepeatConfig: Record<string, unknown> = {
    ...prevRc,
    engine: "MULTI_TASK",
    frequency: "multi_task",
  };

  if (params.startDate) {
    newRepeatConfig.startDate = params.startDate;
  } else {
    delete newRepeatConfig.startDate;
  }

  if (params.endDate) {
    newRepeatConfig.endDate = params.endDate;
  } else {
    delete newRepeatConfig.endDate;
  }

  const trimmedTitle = params.title.trim();
  const mins = parseInt(params.estimatedMinutesStr, 10);

  const taskUpdates = {
    title: trimmedTitle,
    xpReward: params.xpReward,
    estimatedMinutes: isNaN(mins) ? null : mins,
    repeatConfig: newRepeatConfig,
  };

  return {
    targetTaskId: effectiveTaskId,
    isSkillPetBacked,
    taskUpdates,
    petUpdates: isSkillPetBacked ? { title: trimmedTitle } : undefined,
  };
}

export function isTaskDueToday(task: TaskItem, today: Date = new Date()): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string; days?: string[]; specificDate?: string; scheduleType?: string; customDates?: string[]; startDate?: string; endDate?: string } | null;
  const engine = task.planningEngineType || rc?.engine;
  const frequency = rc?.frequency;

  if (isDailyRoutine(task)) {
    return true;
  }

  if (isMultiTaskProject(task)) {
    if (rc?.startDate && rc?.endDate) {
      const [sy, sm, sd] = rc.startDate.split("-").map(Number);
      const [ey, em, ed] = rc.endDate.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed, 23, 59, 59);
      return today >= start && today <= end;
    }
    return true;
  }

  if (!rc) {
    return false;
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