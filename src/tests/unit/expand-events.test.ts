import { expandEvents, toDateStr } from "@/lib/calendar/expand-events";
import { TaskItem, LifeDomainItem } from "@/types";

describe("expandEvents", () => {
  const dummyDomain: LifeDomainItem = {
    id: "dom-1",
    userId: "user-1",
    name: "Health & Wellness",
    slug: "health",
    accentColor: "#10B981",
    avatarSpecies: "Vitality Wolf",
    level: 1,
    currentXp: 0,
    isActive: true,
  };

  const today = new Date();
  const todayStr = toDateStr(today);

  // 7-day range around today
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - 3);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(today.getDate() + 3);

  test("filters out unscheduled Kanban board subtasks (boardId set, no repeatConfig)", () => {
    const tasks: TaskItem[] = [
      {
        id: "board-task-1",
        domainId: "dom-1",
        boardId: "project-board-123",
        title: "Milestone 1: Scope & Planning",
        columnId: "TODO",
        isCompleted: false,
        xpReward: 25,
        sortOrder: 0,
        repeatConfig: null,
      },
      {
        id: "daily-walk",
        domainId: "dom-1",
        title: "Daily Walk",
        columnId: "DONE",
        isCompleted: true,
        xpReward: 25,
        sortOrder: 1,
        repeatConfig: {
          engine: "DAILY_ROUTINE",
          frequency: "daily",
        },
      },
    ];

    const events = expandEvents(tasks, [dummyDomain], rangeStart, rangeEnd);
    const boardEvents = events.filter((e) => e.taskId === "board-task-1");
    const walkEvents = events.filter((e) => e.taskId === "daily-walk");

    expect(boardEvents.length).toBe(0);
    expect(walkEvents.length).toBeGreaterThan(0);
  });

  test("marks multi-task project as worked on today, but never completed on future days ahead", () => {
    const tasks: TaskItem[] = [
      {
        id: "multi-task-proj",
        domainId: "dom-1",
        title: "PetYourSkills Sprint",
        columnId: "DONE",
        isCompleted: true,
        xpReward: 100,
        sortOrder: 0,
        planningEngineType: "MULTI_TASK",
        repeatConfig: {
          engine: "MULTI_TASK",
          frequency: "multi_task",
          startDate: toDateStr(rangeStart),
          endDate: toDateStr(rangeEnd),
        },
      },
    ];

    const events = expandEvents(tasks, [dummyDomain], rangeStart, rangeEnd);
    expect(events.length).toBeGreaterThan(0);

    const todayEvent = events.find((e) => e.date === todayStr);
    expect(todayEvent?.isCompleted).toBe(true);

    // Future days must not be marked completed ahead of time
    const futureEvents = events.filter((e) => e.date > todayStr);
    expect(futureEvents.length).toBeGreaterThan(0);
    expect(futureEvents.every((e) => e.isCompleted === false)).toBe(true);
  });

  test("marks completed daily routine task as completed on today", () => {
    const tasks: TaskItem[] = [
      {
        id: "routine-dish",
        domainId: "dom-1",
        title: "Wash Dishes",
        columnId: "DONE",
        isCompleted: true,
        xpReward: 25,
        sortOrder: 0,
        repeatConfig: {
          engine: "DAILY_ROUTINE",
          frequency: "daily",
        },
      },
    ];

    const events = expandEvents(tasks, [dummyDomain], rangeStart, rangeEnd);
    const todayEvent = events.find((e) => e.date === todayStr);

    expect(todayEvent).toBeDefined();
    expect(todayEvent?.isCompleted).toBe(true);
  });
});
