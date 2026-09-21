import { prisma } from "@/lib/prisma";
import { TaskItem } from "@/types";

/**
 * Server-only shared-project resolution. A "project" can be a KanbanBoard,
 * a MULTI_TASK root Task, or a MULTI_TASK SkillPet — and pet/task twins with
 * the same title+domain share one board identity (cards may be stored under
 * EITHER id, so reads always union the twin ids).
 */

export interface SharedProjectWithTasks {
  id: string;
  title: string;
  type: "BOARD" | "TASK" | "PET";
  accentColor: string;
  avatarSpecies: string;
  /** User who owns the project (board owner or domain owner) — for authz */
  ownerUserId: string | null;
  tasks: TaskItem[];
}

/** Structural mapper from a DB task row to the client TaskItem shape. */
export function mapDbTask(t: {
  id: string;
  domainId: string;
  boardId: string | null;
  title: string;
  columnId: string;
  isCompleted: boolean;
  doneAt: Date | null;
  xpReward: number;
  estimatedMinutes: number | null;
  repeatConfig: unknown;
  sortOrder: number;
  assignee?: any;
}): TaskItem {
  return {
    id: t.id,
    domainId: t.domainId,
    boardId: t.boardId,
    title: t.title,
    columnId: t.columnId as TaskItem["columnId"],
    isCompleted: t.isCompleted,
    doneAt: t.doneAt ? t.doneAt.toISOString() : null,
    xpReward: t.xpReward,
    estimatedMinutes: t.estimatedMinutes,
    repeatConfig: t.repeatConfig as TaskItem["repeatConfig"],
    sortOrder: t.sortOrder,
    assignee: t.assignee && typeof t.assignee === 'object' && 'id' in t.assignee && 'name' in t.assignee
      ? { id: t.assignee.id as string, name: t.assignee.name as string }
      : null,
  };
}

/**
 * Resolves a shared project id against boards, multi-task root tasks, and
 * multi-task skill pets. Returns only the project's own metadata and its
 * board tasks — never the owner's other domains, habits, or pets.
 */
export async function resolveSharedProjectById(
  projectId: string
): Promise<SharedProjectWithTasks | null> {  // 1. Kanban board
  const board = await prisma.kanbanBoard
    .findUnique({
      where: { id: projectId },
      include: { domain: true },
    })
    .catch(() => null);
  if (board) {
    const boardTasks = await prisma.task
      .findMany({
        where: { boardId: board.id },
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => [] as { id: string }[]);
    return {
      id: board.id,
      title: board.title,
      type: "BOARD",
      accentColor: board.domain?.accentColor ?? "#10B981",
      avatarSpecies: board.domain?.avatarSpecies ?? "Aegis Turtle",
      ownerUserId: board.ownerId,
      tasks: (boardTasks as Parameters<typeof mapDbTask>[0][]).map(mapDbTask),
    };
  }

  // 2. Multi-task root task — its subtasks reference it via boardId.
  // A twin SkillPet may share the same project identity (same title+domain);
  // cards are written under EITHER id, so read the union of both.
  const rootTask = await prisma.task
    .findUnique({ where: { id: projectId }, include: { domain: true } })
    .catch(() => null);
  if (rootTask) {
    const twinPet = await prisma.skillPet
      .findFirst({
        where: {
          domainId: rootTask.domainId,
          title: { equals: rootTask.title, mode: "insensitive" },
          planningEngineType: "MULTI_TASK",
        },
      })
      .catch(() => null);
    const boardIds = twinPet ? [rootTask.id, twinPet.id] : [rootTask.id];
    const subtasks = await prisma.task
      .findMany({
        where: { boardId: { in: boardIds } },
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => [] as { id: string }[]);
    return {
      id: rootTask.id,
      title: rootTask.title,
      type: "TASK",
      accentColor: rootTask.domain?.accentColor ?? "#8B5CF6",
      avatarSpecies: rootTask.domain?.avatarSpecies ?? "Byte Fox",
      ownerUserId: rootTask.domain?.userId ?? null,
      tasks: (subtasks as Parameters<typeof mapDbTask>[0][]).map(mapDbTask),
    };
  }

  // 3. Multi-task skill pet — its subtasks reference it via boardId.
  // Also union the twin MULTI_TASK root task sharing the same identity.
  const pet = await prisma.skillPet
    .findUnique({ where: { id: projectId }, include: { domain: true } })
    .catch(() => null);
  if (pet) {
    const twinCandidates = await prisma.task
      .findMany({
        where: {
          domainId: pet.domainId,
          title: { equals: pet.title, mode: "insensitive" },
        },
      })
      .catch(() => [] as { id: string; repeatConfig: unknown }[]);
    const twinTask = (
      twinCandidates as { id: string; repeatConfig: unknown }[]
    ).find((t) => {
      const rc = t.repeatConfig as {
        engine?: string;
        frequency?: string;
      } | null;
      return rc?.engine === "MULTI_TASK" || rc?.frequency === "multi_task";
    });
    const boardIds = twinTask ? [pet.id, twinTask.id] : [pet.id];
    const subtasks = await prisma.task
      .findMany({
        where: { boardId: { in: boardIds } },
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => [] as { id: string }[]);
    return {
      id: pet.id,
      title: pet.title,
      type: "PET",
      accentColor: pet.domain?.accentColor ?? "#F59E0B",
      avatarSpecies: pet.domain?.avatarSpecies ?? "Wisdom Owl",
      ownerUserId: pet.domain?.userId ?? null,
      tasks: (subtasks as Parameters<typeof mapDbTask>[0][]).map(mapDbTask),
    };
  }

  return null;
}

/**
 * Resolves the full set of equivalent project ids for a shared project.
 *
 * A project can exist as a KanbanBoard, a MULTI_TASK root Task, or a
 * MULTI_TASK SkillPet — and a task/pet pair with the same title + domain share
 * one board identity (cards and collaborator scope may live under EITHER id).
 * Members are scoped to a single id via `sharedProjectId`, so queries must
 * union every equivalent id regardless of which id the viewer opened.
 *
 * Returns a de-duplicated array containing the given id plus any twins.
 */
export async function resolveProjectTwinIds(projectId: string): Promise<string[]> {
  const ids = new Set<string>([projectId]);

  // 1. Kanban board — guests are scoped to the board id directly.
  const board = await prisma.kanbanBoard
    .findUnique({ where: { id: projectId }, select: { id: true } })
    .catch(() => null);
  if (board) return [board.id];

  // 2. MULTI_TASK root task — union the twin skill pet with the same title.
  const task = await prisma.task
    .findUnique({ where: { id: projectId }, select: { id: true, domainId: true, title: true, repeatConfig: true } })
    .catch(() => null);
  if (task) {
    ids.add(task.id);
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    const isMultiTask = rc?.engine === "MULTI_TASK" || rc?.frequency === "multi_task";
    if (isMultiTask) {
      const twinPet = await prisma.skillPet
        .findFirst({
          where: {
            domainId: task.domainId,
            title: { equals: task.title, mode: "insensitive" },
            planningEngineType: "MULTI_TASK",
          },
          select: { id: true },
        })
        .catch(() => null);
      if (twinPet) ids.add(twinPet.id);
    }
    return [...ids];
  }

  // 3. MULTI_TASK skill pet — union the twin root task with the same title.
  const pet = await prisma.skillPet
    .findUnique({ where: { id: projectId }, select: { id: true, domainId: true, title: true } })
    .catch(() => null);
  if (pet) {
    ids.add(pet.id);
    const twinTasks = await prisma.task
      .findMany({
        where: { domainId: pet.domainId, title: { equals: pet.title, mode: "insensitive" } },
        select: { id: true, repeatConfig: true },
      })
      .catch(() => [] as { id: string; repeatConfig: unknown }[]);
    for (const t of twinTasks as { id: string; repeatConfig: { engine?: string; frequency?: string } | null }[]) {
      if (t.repeatConfig?.engine === "MULTI_TASK" || t.repeatConfig?.frequency === "multi_task") {
        ids.add(t.id);
      }
    }
    return [...ids];
  }

  return [...ids];
}
