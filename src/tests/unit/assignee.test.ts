import { TaskItem, SkillRepeatConfig } from "@/types";

describe("Assignee Functionality", () => {
  describe("TaskItem type", () => {
    it("should accept assignee with id and name", () => {
      const task: TaskItem = {
        id: "task-1",
        domainId: "dom-1",
        title: "Test Task",
        columnId: "TODO",
        isCompleted: false,
        xpReward: 25,
        estimatedMinutes: 30,
        sortOrder: 1,
        assignee: { id: "user-1", name: "John Doe" },
      };

      expect(task.assignee).toBeDefined();
      expect(task.assignee?.id).toBe("user-1");
      expect(task.assignee?.name).toBe("John Doe");
    });

    it("should accept null assignee", () => {
      const task: TaskItem = {
        id: "task-1",
        domainId: "dom-1",
        title: "Test Task",
        columnId: "TODO",
        isCompleted: false,
        xpReward: 25,
        estimatedMinutes: 30,
        sortOrder: 1,
        assignee: null,
      };

      expect(task.assignee).toBeNull();
    });

    it("should accept undefined assignee", () => {
      const task: TaskItem = {
        id: "task-1",
        domainId: "dom-1",
        title: "Test Task",
        columnId: "TODO",
        isCompleted: false,
        xpReward: 25,
        estimatedMinutes: 30,
        sortOrder: 1,
      };

      expect(task.assignee).toBeUndefined();
    });
  });

  describe("SkillRepeatConfig with assignee", () => {
    it("should accept assignee in repeatConfig", () => {
      const config: SkillRepeatConfig = {
        engine: "MULTI_TASK",
        assignee: { id: "user-2", name: "Jane Smith" },
      };

      expect(config.assignee).toBeDefined();
      expect((config.assignee as { id: string; name: string } | undefined)?.name).toBe("Jane Smith");
    });
  });
});

describe("mapDbTask assignee mapping", () => {
  // This tests the mapDbTask function logic
  const mapDbTask = (t: any) => {
    return {
      id: t.id,
      domainId: t.domainId,
      boardId: t.boardId,
      title: t.title,
      columnId: t.columnId,
      isCompleted: t.isCompleted,
      doneAt: t.doneAt ? t.doneAt.toISOString() : null,
      xpReward: t.xpReward,
      estimatedMinutes: t.estimatedMinutes,
      repeatConfig: t.repeatConfig,
      sortOrder: t.sortOrder,
      assignee: t.assignee && typeof t.assignee === 'object' && 'id' in t.assignee && 'name' in t.assignee
        ? { id: t.assignee.id as string, name: t.assignee.name as string }
        : null,
    };
  };

  it("should map assignee from database object", () => {
    const dbTask = {
      id: "task-1",
      domainId: "dom-1",
      boardId: "board-1",
      title: "Test Task",
      columnId: "TODO",
      isCompleted: false,
      doneAt: new Date(),
      xpReward: 25,
      estimatedMinutes: 30,
      repeatConfig: { engine: "MULTI_TASK" },
      sortOrder: 1,
      assignee: { id: "user-1", name: "John Doe" },
    };

    const result = mapDbTask(dbTask);
    expect(result.assignee).toEqual({ id: "user-1", name: "John Doe" });
  });

  it("should return null for invalid assignee", () => {
    const dbTask = {
      id: "task-1",
      domainId: "dom-1",
      boardId: "board-1",
      title: "Test Task",
      columnId: "TODO",
      isCompleted: false,
      doneAt: new Date(),
      xpReward: 25,
      estimatedMinutes: 30,
      repeatConfig: { engine: "MULTI_TASK" },
      sortOrder: 1,
      assignee: "invalid-string",
    };

    const result = mapDbTask(dbTask);
    expect(result.assignee).toBeNull();
  });

  it("should return null for missing assignee", () => {
    const dbTask = {
      id: "task-1",
      domainId: "dom-1",
      boardId: "board-1",
      title: "Test Task",
      columnId: "TODO",
      isCompleted: false,
      doneAt: new Date(),
      xpReward: 25,
      estimatedMinutes: 30,
      repeatConfig: { engine: "MULTI_TASK" },
      sortOrder: 1,
    };

    const result = mapDbTask(dbTask);
    expect(result.assignee).toBeNull();
  });

  it("should return null for assignee without id or name", () => {
    const dbTask = {
      id: "task-1",
      domainId: "dom-1",
      boardId: "board-1",
      title: "Test Task",
      columnId: "TODO",
      isCompleted: false,
      doneAt: new Date(),
      xpReward: 25,
      estimatedMinutes: 30,
      repeatConfig: { engine: "MULTI_TASK" },
      sortOrder: 1,
      assignee: { id: "user-1" }, // missing name
    };

    const result = mapDbTask(dbTask);
    expect(result.assignee).toBeNull();
  });
});

describe("Assignee merge logic", () => {
  // Simulates the refreshProjectTasks merge logic
  const mergeWithLocal = (serverTasks: any[], localTasks: any[]) => {
    return serverTasks.map((serverTask) => {
      const localTask = localTasks.find((t) => t.id === serverTask.id);
      if (localTask && localTask.assignee && !serverTask.assignee) {
        return { ...serverTask, assignee: localTask.assignee };
      }
      return serverTask;
    });
  };

  it("should preserve local assignee when server lacks it", () => {
    const serverTasks = [
      { id: "task-1", title: "Task 1", assignee: null },
    ];
    const localTasks = [
      { id: "task-1", title: "Task 1", assignee: { id: "user-1", name: "John Doe" } },
    ];

    const result = mergeWithLocal(serverTasks, localTasks);
    expect(result[0].assignee).toEqual({ id: "user-1", name: "John Doe" });
  });

  it("should use server assignee when present", () => {
    const serverTasks = [
      { id: "task-1", title: "Task 1", assignee: { id: "user-2", name: "Jane Smith" } },
    ];
    const localTasks = [
      { id: "task-1", title: "Task 1", assignee: { id: "user-1", name: "John Doe" } },
    ];

    const result = mergeWithLocal(serverTasks, localTasks);
    expect(result[0].assignee).toEqual({ id: "user-2", name: "Jane Smith" });
  });

  it("should keep server assignee when local has none", () => {
    const serverTasks = [
      { id: "task-1", title: "Task 1", assignee: { id: "user-2", name: "Jane Smith" } },
    ];
    const localTasks = [
      { id: "task-1", title: "Task 1", assignee: null },
    ];

    const result = mergeWithLocal(serverTasks, localTasks);
    expect(result[0].assignee).toEqual({ id: "user-2", name: "Jane Smith" });
  });

  it("should handle tasks without assignee on both sides", () => {
    const serverTasks = [
      { id: "task-1", title: "Task 1", assignee: null },
    ];
    const localTasks = [
      { id: "task-1", title: "Task 1", assignee: null },
    ];

    const result = mergeWithLocal(serverTasks, localTasks);
    expect(result[0].assignee).toBeNull();
  });
});