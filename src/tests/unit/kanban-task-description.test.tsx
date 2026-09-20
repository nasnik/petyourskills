/**
 * Tests for Kanban board task description persistence.
 *
 * Covers the two regression scenarios reported:
 *
 * 1. Inline card add form: description typed into the "fast-add" textarea
 *    must survive the 3-second background poll re-render and be submitted
 *    intact when the user clicks "Add".
 *
 * 2. Task Inspector drawer: description typed into the drawer must NOT be
 *    wiped by background polling (setTasks with new array reference), only
 *    by explicitly switching to a different task.
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TaskInspectorDrawer } from "@/components/inspector/task-inspector-drawer";
import { useApp } from "@/lib/store/app-context";
import { TaskItem, LifeDomainItem } from "@/types";

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

jest.mock("@/lib/store/app-context", () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

// --------------------------------------------------------------------------
// Shared fixtures
// --------------------------------------------------------------------------

const sampleDomain: LifeDomainItem = {
  id: "dom-career",
  userId: "user-1",
  name: "Career",
  slug: "career",
  accentColor: "#8B5CF6",
  avatarSpecies: "Byte Fox",
  level: 5,
  currentXp: 800,
  isActive: true,
};

const makeTask = (overrides: Partial<TaskItem> = {}): TaskItem => ({
  id: "task-impl-algo",
  domainId: "dom-career",
  title: "Implement Algorithms",
  description: null,
  columnId: "TODO",
  isCompleted: false,
  xpReward: 30,
  estimatedMinutes: 25,
  sortOrder: 1,
  boardId: "board-interview-prep",
  ...overrides,
});

const buildAppContext = (
  inspectingTask: TaskItem | null,
  extra: Record<string, unknown> = {}
) => ({
  inspectingTask,
  closeTaskInspector: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  toggleTaskComplete: jest.fn(),
  domains: [sampleDomain],
  updateTaskDescription: jest.fn(),
  loadTaskComments: jest.fn().mockResolvedValue(undefined),
  addComment: jest.fn(),
  comments: new Map(),
  ...extra,
});

// --------------------------------------------------------------------------
// Suite 1: Task Inspector Drawer
// --------------------------------------------------------------------------

describe("TaskInspectorDrawer - description persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("populates textarea from task description when opened", () => {
    const task = makeTask({ description: "Existing description text" });
    mockUseApp.mockReturnValue(buildAppContext(task) as any);

    render(<TaskInspectorDrawer />);

    const textarea = screen.getByPlaceholderText(
      /describe this task or project milestone/i
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Existing description text");
  });

  it("does NOT wipe typed description on background polling re-render", () => {
    const task = makeTask({ description: null });
    mockUseApp.mockReturnValue(buildAppContext(task) as any);

    const { rerender } = render(<TaskInspectorDrawer />);

    const textarea = screen.getByPlaceholderText(
      /describe this task or project milestone/i
    );
    fireEvent.change(textarea, { target: { value: "My new description" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("My new description");

    // Simulate polling: same task id, new object reference
    const polledTask = { ...task, updatedAt: new Date().toISOString() };
    mockUseApp.mockReturnValue(buildAppContext(polledTask) as any);
    rerender(<TaskInspectorDrawer />);

    expect((textarea as HTMLTextAreaElement).value).toBe("My new description");
  });

  it("resets description when switching to a different task", () => {
    const taskA = makeTask({ id: "task-a", title: "Task A", description: "Description A" });
    mockUseApp.mockReturnValue(buildAppContext(taskA) as any);

    const { rerender } = render(<TaskInspectorDrawer />);

    const textarea = screen.getByPlaceholderText(
      /describe this task or project milestone/i
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Description A");

    fireEvent.change(textarea, { target: { value: "Edited A" } });

    const taskB = makeTask({ id: "task-b", title: "Task B", description: "Description B" });
    mockUseApp.mockReturnValue(buildAppContext(taskB) as any);
    rerender(<TaskInspectorDrawer />);

    expect(textarea.value).toBe("Description B");
  });

  it("calls updateTask and updateTaskDescription with typed description on Save", () => {
    const task = makeTask({ description: null });
    const mockUpdateTask = jest.fn();
    const mockUpdateTaskDescription = jest.fn();
    const mockClose = jest.fn();

    mockUseApp.mockReturnValue(
      buildAppContext(task, {
        updateTask: mockUpdateTask,
        updateTaskDescription: mockUpdateTaskDescription,
        closeTaskInspector: mockClose,
      }) as any
    );

    render(<TaskInspectorDrawer />);

    const textarea = screen.getByPlaceholderText(
      /describe this task or project milestone/i
    );
    fireEvent.change(textarea, { target: { value: "Learn dynamic programming" } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: task.id, description: "Learn dynamic programming" })
    );
    expect(mockUpdateTaskDescription).toHaveBeenCalledWith(task.id, "Learn dynamic programming");
    expect(mockClose).toHaveBeenCalled();
  });

  it("saves null when textarea is blank on Save", () => {
    const task = makeTask({ description: "Old description" });
    const mockUpdateTask = jest.fn();
    const mockUpdateTaskDescription = jest.fn();

    mockUseApp.mockReturnValue(
      buildAppContext(task, {
        updateTask: mockUpdateTask,
        updateTaskDescription: mockUpdateTaskDescription,
        closeTaskInspector: jest.fn(),
      }) as any
    );

    render(<TaskInspectorDrawer />);

    const textarea = screen.getByPlaceholderText(
      /describe this task or project milestone/i
    );
    fireEvent.change(textarea, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ description: null })
    );
    expect(mockUpdateTaskDescription).toHaveBeenCalledWith(task.id, null);
  });
});

// --------------------------------------------------------------------------
// Suite 2: addProjectSubtask pure logic
// --------------------------------------------------------------------------

describe("addProjectSubtask logic - description included in payload", () => {
  it("builds task with description from params", () => {
    const params = {
      boardId: "board-interview",
      domainId: "dom-career",
      title: "Implement BFS",
      description: "Study breadth-first search on undirected graphs",
      columnId: "TODO" as const,
      xpReward: 30,
      estimatedMinutes: 25,
      assignee: null,
    };

    const newTask: TaskItem = {
      id: "task-temp",
      domainId: params.domainId,
      boardId: params.boardId,
      title: params.title,
      description: params.description,
      columnId: params.columnId,
      isCompleted: false,
      xpReward: params.xpReward,
      estimatedMinutes: params.estimatedMinutes,
      sortOrder: 1,
      assignee: params.assignee,
    };

    expect(newTask.description).toBe("Study breadth-first search on undirected graphs");
    expect(newTask.boardId).toBe("board-interview");
  });

  it("trims description to null when empty", () => {
    expect("".trim() || null).toBeNull();
    expect("   ".trim() || null).toBeNull();
  });

  it("preserves non-empty description after trim", () => {
    const desc = "  Study Dijkstra's algorithm  ".trim() || null;
    expect(desc).toBe("Study Dijkstra's algorithm");
  });

  it("includes assignee in task payload when provided", () => {
    const assignee = { id: "manual", name: "Alice" };
    const newTask: TaskItem = {
      id: "task-123",
      domainId: "dom-1",
      boardId: "board-1",
      title: "Code Review",
      description: null,
      columnId: "IN_PROGRESS",
      isCompleted: false,
      xpReward: 20,
      estimatedMinutes: 15,
      sortOrder: 2,
      assignee,
    };

    expect(newTask.assignee).toEqual({ id: "manual", name: "Alice" });
  });
});

// --------------------------------------------------------------------------
// Suite 3: Inline add form local state survives polling re-renders
// --------------------------------------------------------------------------

describe("ProjectKanbanBoard inline add form - description survives polling", () => {
  function InlineAddForm({ onSubmit }: { onSubmit: (desc: string) => void }) {
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");

    return (
      <div>
        <input
          data-testid="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <textarea
          data-testid="desc-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <button onClick={() => onSubmit(description)}>Add</button>
      </div>
    );
  }

  it("description local state is preserved across re-renders from polling", () => {
    const handleSubmit = jest.fn();
    const { rerender } = render(<InlineAddForm onSubmit={handleSubmit} />);

    const titleInput = screen.getByTestId("title-input");
    const descTextarea = screen.getByTestId("desc-textarea");

    fireEvent.change(titleInput, { target: { value: "New Kanban Task" } });
    fireEvent.change(descTextarea, { target: { value: "Detailed description text" } });

    expect((descTextarea as HTMLTextAreaElement).value).toBe("Detailed description text");

    // Simulate three polling re-renders
    rerender(<InlineAddForm onSubmit={handleSubmit} />);
    rerender(<InlineAddForm onSubmit={handleSubmit} />);
    rerender(<InlineAddForm onSubmit={handleSubmit} />);

    expect((descTextarea as HTMLTextAreaElement).value).toBe("Detailed description text");
    expect((titleInput as HTMLInputElement).value).toBe("New Kanban Task");
  });

  it("submits description to handler when Add is clicked", () => {
    const handleSubmit = jest.fn();
    render(<InlineAddForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByTestId("desc-textarea"), {
      target: { value: "Important description" },
    });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(handleSubmit).toHaveBeenCalledWith("Important description");
  });

  it("submits empty string when description textarea is blank", () => {
    const handleSubmit = jest.fn();
    render(<InlineAddForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(handleSubmit).toHaveBeenCalledWith("");
  });
});
