import { resolveProjectTwinIds } from "./shared-project";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    kanbanBoard: { findUnique: jest.fn() },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    skillPet: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const mockBoard = prisma.kanbanBoard.findUnique as jest.Mock;
const mockTaskFindUnique = prisma.task.findUnique as jest.Mock;
const mockTaskFindMany = prisma.task.findMany as jest.Mock;
const mockPetFindUnique = prisma.skillPet.findUnique as jest.Mock;
const mockPetFindFirst = prisma.skillPet.findFirst as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("resolveProjectTwinIds", () => {
  it("returns just the id for a Kanban board (no twins)", async () => {
    mockBoard.mockResolvedValue({ id: "board-main" });
    mockTaskFindUnique.mockResolvedValue(null);

    const ids = await resolveProjectTwinIds("board-main");

    expect(ids).toEqual(["board-main"]);
  });

  it("unions the twin skill pet for a MULTI_TASK root task", async () => {
    mockBoard.mockResolvedValue(null);
    mockTaskFindUnique.mockResolvedValue({
      id: "task-interview",
      domainId: "dom-learning",
      title: "Interview Preparation",
      repeatConfig: { engine: "MULTI_TASK", frequency: "multi_task" },
    });
    mockPetFindFirst.mockResolvedValue({ id: "pet-learning" });

    const ids = await resolveProjectTwinIds("task-interview");

    expect(ids).toContain("task-interview");
    expect(ids).toContain("pet-learning");
    expect(ids).toHaveLength(2);
  });

  it("unions the twin root task for a MULTI_TASK skill pet", async () => {
    mockBoard.mockResolvedValue(null);
    mockTaskFindUnique.mockResolvedValue(null);
    mockPetFindUnique.mockResolvedValue({
      id: "pet-learning",
      domainId: "dom-learning",
      title: "Interview Preparation",
    });
    mockTaskFindMany.mockResolvedValue([
      { id: "task-interview", repeatConfig: { engine: "MULTI_TASK", frequency: "multi_task" } },
      { id: "task-other", repeatConfig: { frequency: "daily" } },
    ]);

    const ids = await resolveProjectTwinIds("pet-learning");

    expect(ids).toContain("pet-learning");
    expect(ids).toContain("task-interview");
    // Non-MULTI_TASK twin is excluded.
    expect(ids).not.toContain("task-other");
    expect(ids).toHaveLength(2);
  });

  it("returns the given id when the project does not resolve to a board, task, or pet", async () => {
    mockBoard.mockResolvedValue(null);
    mockTaskFindUnique.mockResolvedValue(null);
    mockPetFindUnique.mockResolvedValue(null);

    const ids = await resolveProjectTwinIds("unknown-id");

    expect(ids).toEqual(["unknown-id"]);
  });
});
