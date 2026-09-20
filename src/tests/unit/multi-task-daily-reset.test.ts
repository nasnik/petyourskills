import {
  isMultiTaskProject,
  isDailyRoutine,
  isDailyPlanQuest,
  isCompletedToday,
  isTaskDueToday,
  isSameDay,
  resolveMultiTaskProjectTask,
  buildMultiTaskProjectSavePlan,
} from "@/lib/schedule-utils";
import { TaskItem, LifeDomainItem } from "@/types";

describe("Multi-Task Project Daily Reset & Completion", () => {
  const today = new Date();
  const todayIso = today.toISOString();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = yesterday.toISOString();

  const sampleMultiTaskProject: TaskItem = {
    id: "proj-1",
    domainId: "dom-work",
    title: "PetYourSkills",
    columnId: "TODO",
    isCompleted: false,
    xpReward: 50,
    sortOrder: 1,
    repeatConfig: {
      engine: "MULTI_TASK",
      frequency: "multi_task",
    },
    planningEngineType: "MULTI_TASK",
  };

  const sampleDailyRoutine: TaskItem = {
    id: "habit-1",
    domainId: "dom-health",
    title: "Daily 10000 steps",
    columnId: "TODO",
    isCompleted: false,
    xpReward: 25,
    sortOrder: 2,
    repeatConfig: {
      engine: "DAILY_ROUTINE",
      frequency: "daily",
    },
    planningEngineType: "DAILY_ROUTINE",
  };

  const sampleBoardSubtask: TaskItem = {
    id: "subtask-1",
    boardId: "proj-1",
    domainId: "dom-work",
    title: "Setup CI pipeline",
    columnId: "DONE",
    isCompleted: true,
    doneAt: yesterdayIso,
    xpReward: 30,
    sortOrder: 3,
  };

  describe("Identification Helpers", () => {
    it("correctly identifies multi-task project root tasks", () => {
      expect(isMultiTaskProject(sampleMultiTaskProject)).toBe(true);
      expect(isMultiTaskProject(sampleDailyRoutine)).toBe(false);
      // Board subtasks should not be treated as root multi-task projects
      expect(isMultiTaskProject(sampleBoardSubtask)).toBe(false);
    });

    it("correctly identifies daily routines", () => {
      expect(isDailyRoutine(sampleDailyRoutine)).toBe(true);
      expect(isDailyRoutine(sampleMultiTaskProject)).toBe(false);
      expect(isDailyRoutine(sampleBoardSubtask)).toBe(false);
    });

    it("identifies daily plan quests including both routines and multi-task projects", () => {
      expect(isDailyPlanQuest(sampleDailyRoutine)).toBe(true);
      expect(isDailyPlanQuest(sampleMultiTaskProject)).toBe(true);
      expect(isDailyPlanQuest(sampleBoardSubtask)).toBe(false);
    });
  });

  describe("isCompletedToday", () => {
    it("returns false for an uncompleted task", () => {
      expect(isCompletedToday(sampleMultiTaskProject, today)).toBe(false);
    });

    it("returns true when completed today", () => {
      const completedToday: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        doneAt: todayIso,
      };
      expect(isCompletedToday(completedToday, today)).toBe(true);
    });

    it("returns false for a project completed yesterday (first entry for today)", () => {
      const completedYesterday: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        doneAt: yesterdayIso,
      };
      // When opening the app today, it should NOT appear completed
      expect(isCompletedToday(completedYesterday, today)).toBe(false);
    });

    it("returns false for a daily plan quest that has isCompleted true but no doneAt", () => {
      const staleTask: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        doneAt: null,
      };
      expect(isCompletedToday(staleTask, today)).toBe(false);
    });
  });

  describe("Daily Quest Reset Logic", () => {
    function resetDailyQuestsInMemory(
      tasks: TaskItem[],
      domains: LifeDomainItem[],
      currentDate: Date
    ): { tasks: TaskItem[]; domains: LifeDomainItem[] } {
      const tasksToReset = tasks.filter(
        (t) => t.isCompleted && isDailyPlanQuest(t) && !isSameDay(t.doneAt, currentDate)
      );

      const resetIds = new Set(tasksToReset.map((t) => t.id));

      const updatedTasks = tasks.map((t) => {
        if (resetIds.has(t.id)) {
          return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
        }
        return t;
      });

      // Earned XP is retained on reset — domains/users are not penalized for previous days
      return { tasks: updatedTasks, domains };
    }

    it("resets a multi-task project completed yesterday when opened today", () => {
      const projectDoneYesterday: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        columnId: "DONE",
        doneAt: yesterdayIso,
      };

      const domains: LifeDomainItem[] = [
        {
          id: "dom-work",
          userId: "user-1",
          name: "Work",
          slug: "work",
          accentColor: "#3B82F6",
          avatarSpecies: "Byte Fox",
          level: 10,
          currentXp: 1500,
          isActive: true,
        },
      ];

      const result = resetDailyQuestsInMemory(
        [projectDoneYesterday, sampleBoardSubtask],
        domains,
        today
      );

      const resetProject = result.tasks.find((t) => t.id === "proj-1")!;
      expect(resetProject.isCompleted).toBe(false);
      expect(resetProject.columnId).toBe("TODO");
      expect(resetProject.doneAt).toBeNull();

      // Board subtasks remain unaffected in DONE column
      const preservedSubtask = result.tasks.find((t) => t.id === "subtask-1")!;
      expect(preservedSubtask.isCompleted).toBe(true);
      expect(preservedSubtask.columnId).toBe("DONE");

      // XP should NOT be decremented
      expect(result.domains[0].currentXp).toBe(1500);
    });

    it("preserves projects that were completed today", () => {
      const projectDoneToday: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        columnId: "DONE",
        doneAt: todayIso,
      };

      const result = resetDailyQuestsInMemory([projectDoneToday], [], today);

      const proj = result.tasks.find((t) => t.id === "proj-1")!;
      expect(proj.isCompleted).toBe(true);
      expect(proj.doneAt).toBe(todayIso);
    });

    it("does not delete or remove project when marking completed today", () => {
      // Marking completed today sets doneAt and completes it for today
      const markedDone: TaskItem = {
        ...sampleMultiTaskProject,
        isCompleted: true,
        columnId: "DONE",
        doneAt: todayIso,
      };

      expect(markedDone.id).toBe("proj-1");
      expect(markedDone.title).toBe("PetYourSkills");
      expect(markedDone.planningEngineType).toBe("MULTI_TASK");
      expect(isCompletedToday(markedDone, today)).toBe(true);

      // On the next day, the project still exists with its full configuration, but starts unchecked
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      expect(isCompletedToday(markedDone, tomorrow)).toBe(false);
    });
  });

  describe("isTaskDueToday for Multi-Task Projects", () => {
    it("returns true when project has no specific date constraints", () => {
      expect(isTaskDueToday(sampleMultiTaskProject, today)).toBe(true);
    });

    it("returns true when today is within project date window", () => {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");

      const activeProject: TaskItem = {
        ...sampleMultiTaskProject,
        repeatConfig: {
          ...sampleMultiTaskProject.repeatConfig,
          startDate: `${y}-${m}-01`,
          endDate: `${y}-${m}-28`,
        },
      };

      expect(isTaskDueToday(activeProject, today)).toBe(true);
    });
  });

  describe("resolveMultiTaskProjectTask", () => {
    const taskBackedProject: TaskItem = {
      id: "task-proj-100",
      domainId: "dom-work",
      title: "Direct Task Project",
      columnId: "TODO",
      isCompleted: false,
      xpReward: 50,
      sortOrder: 1,
      planningEngineType: "MULTI_TASK",
    };

    const petBackedTask: TaskItem = {
      id: "task-petyourskills-root",
      domainId: "dom-work",
      title: "PetYourSkills",
      columnId: "TODO",
      isCompleted: false,
      xpReward: 60,
      sortOrder: 2,
      repeatConfig: {
        engine: "MULTI_TASK",
        frequency: "multi_task",
        startDate: "2026-09-01",
        endDate: "2026-09-18",
      },
      planningEngineType: "MULTI_TASK",
    };

    const boardSubtask: TaskItem = {
      id: "subtask-petyourskills",
      boardId: "task-petyourskills-root",
      domainId: "dom-work",
      title: "PetYourSkills",
      columnId: "TODO",
      isCompleted: false,
      xpReward: 20,
      sortOrder: 3,
      planningEngineType: "MULTI_TASK",
    };

    const allTasks = [taskBackedProject, petBackedTask, boardSubtask];

    it("resolves Task-backed project by exact task id match", () => {
      const result = resolveMultiTaskProjectTask(
        "task-proj-100",
        "Direct Task Project",
        "dom-work",
        allTasks
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe("task-proj-100");
    });

    it("resolves SkillPet-backed project where pet id differs from task id", () => {
      // Pet id is "pet-work-ddec10e8", which doesn't match any task.id
      const result = resolveMultiTaskProjectTask(
        "pet-work-ddec10e8",
        "PetYourSkills",
        "dom-work",
        allTasks
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe("task-petyourskills-root");
      expect(result?.title).toBe("PetYourSkills");
      expect((result?.repeatConfig as { endDate?: string })?.endDate).toBe("2026-09-18");
    });

    it("matches SkillPet-backed project title case-insensitively", () => {
      const result = resolveMultiTaskProjectTask(
        "pet-work-ddec10e8",
        "petyourskills",
        "dom-work",
        allTasks
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe("task-petyourskills-root");
    });

    it("ignores board subtasks even if domain, title, and MULTI_TASK match", () => {
      // If only board subtask exists, resolveMultiTaskProjectTask should return null
      const result = resolveMultiTaskProjectTask(
        "pet-isolated",
        "PetYourSkills",
        "dom-work",
        [boardSubtask]
      );
      expect(result).toBeNull();
    });

    it("returns null if no matching task exists", () => {
      const result = resolveMultiTaskProjectTask(
        "non-existent-pet",
        "Non-Existent Project",
        "dom-personal",
        allTasks
      );
      expect(result).toBeNull();
    });
  });

  describe("buildMultiTaskProjectSavePlan", () => {
    it("handles SkillPet-backed project date update (the PetYourSkills bug fix)", () => {
      // User edited PetYourSkills from initial Sep 18 to Sep 30
      const plan = buildMultiTaskProjectSavePlan({
        projectId: "pet-work-ddec10e8", // SkillPet id
        taskId: "task-petyourskills-root", // Associated Task id
        title: "PetYourSkills",
        xpReward: 60,
        estimatedMinutesStr: "45",
        startDate: "2026-09-01",
        endDate: "2026-09-30", // Updated to Sep 30
        prevRepeatConfig: {
          engine: "MULTI_TASK",
          frequency: "multi_task",
          startDate: "2026-09-01",
          endDate: "2026-09-18",
        },
      });

      // Target must be the Task record so repeatConfig doesn't get dropped on SkillPet table
      expect(plan.isSkillPetBacked).toBe(true);
      expect(plan.targetTaskId).toBe("task-petyourskills-root");

      // Task updates must contain the updated end date
      expect(plan.taskUpdates.repeatConfig.endDate).toBe("2026-09-30");
      expect(plan.taskUpdates.repeatConfig.startDate).toBe("2026-09-01");
      expect(plan.taskUpdates.repeatConfig.engine).toBe("MULTI_TASK");
      expect(plan.taskUpdates.repeatConfig.frequency).toBe("multi_task");
      expect(plan.taskUpdates.xpReward).toBe(60);
      expect(plan.taskUpdates.estimatedMinutes).toBe(45);

      // SkillPet receives title update so UI name stays synchronized
      expect(plan.petUpdates).toEqual({ title: "PetYourSkills" });
    });

    it("handles Task-backed project update where taskId equals projectId", () => {
      const plan = buildMultiTaskProjectSavePlan({
        projectId: "task-proj-100",
        taskId: "task-proj-100",
        title: "Updated Task Project",
        xpReward: 50,
        estimatedMinutesStr: "60",
        startDate: "2026-09-10",
        endDate: "2026-09-25",
      });

      expect(plan.isSkillPetBacked).toBe(false);
      expect(plan.targetTaskId).toBe("task-proj-100");
      expect(plan.taskUpdates.title).toBe("Updated Task Project");
      expect(plan.taskUpdates.repeatConfig.startDate).toBe("2026-09-10");
      expect(plan.taskUpdates.repeatConfig.endDate).toBe("2026-09-25");
      expect(plan.petUpdates).toBeUndefined();
    });

    it("clears startDate and endDate when empty strings are passed", () => {
      const plan = buildMultiTaskProjectSavePlan({
        projectId: "task-proj-100",
        taskId: "task-proj-100",
        title: "Cleared Dates Project",
        xpReward: 50,
        estimatedMinutesStr: "",
        startDate: "",
        endDate: "",
        prevRepeatConfig: {
          engine: "MULTI_TASK",
          frequency: "multi_task",
          startDate: "2026-09-01",
          endDate: "2026-09-18",
        },
      });

      expect(plan.taskUpdates.repeatConfig.startDate).toBeUndefined();
      expect(plan.taskUpdates.repeatConfig.endDate).toBeUndefined();
      expect(plan.taskUpdates.estimatedMinutes).toBeNull();
    });

    it("trims whitespace from title", () => {
      const plan = buildMultiTaskProjectSavePlan({
        projectId: "task-proj-100",
        taskId: null,
        title: "   Spaced Title   ",
        xpReward: 50,
        estimatedMinutesStr: "invalid",
        startDate: "",
        endDate: "",
      });

      expect(plan.taskUpdates.title).toBe("Spaced Title");
      expect(plan.taskUpdates.estimatedMinutes).toBeNull();
      expect(plan.targetTaskId).toBe("task-proj-100");
    });
  });
});
