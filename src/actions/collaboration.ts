"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  computeProjectPassCode,
  isValidPassCodeFormat,
  normalizePassCode,
  passCodesMatch,
  PYS_GUEST_NAME_COOKIE,
} from "@/lib/collaboration";
import { INITIAL_DOMAINS, INITIAL_TASKS } from "@/lib/mock-data";
import { resolveSharedProjectById } from "@/lib/shared-project";
import { TaskItem } from "@/types";

/** Cookie tracking the current DB user (same cookie used by actions/auth.ts) */
const PYS_UID_COOKIE = "pys_uid";
/** Cookie tracking which shared project an anonymous guest has joined */
const PYS_SHARED_COOKIE = "pys_shared";

export type SharedProjectType = "BOARD" | "TASK" | "PET";

export interface JoinProjectResult {
  success: boolean;
  error?: string;
  project?: {
    id: string;
    title: string;
    type: SharedProjectType;
    passCode: string;
  };
}

export interface GuestSessionInfo {
  isGuest: boolean;
  projectTitle?: string;
  projectId?: string;
}

export interface ResolvedProject {
  id: string;
  title: string;
  type: SharedProjectType;
  passCode: string;
  domainAccentColor: string | null;
  domainAvatarSpecies: string | null;
}

async function setGuestCookies(userId: string, projectId: string, guestName?: string) {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
  cookieStore.set(PYS_UID_COOKIE, userId, opts);
  cookieStore.set(PYS_SHARED_COOKIE, projectId, opts);
  if (guestName?.trim()) {
    cookieStore.set(PYS_GUEST_NAME_COOKIE, guestName.trim(), {
      ...opts,
      httpOnly: false, // client-readable so join form and comments can prefill
    });
  }
}

/** Reads the shared-project cookie (server-side only). */
export async function getPysSharedFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PYS_SHARED_COOKIE)?.value ?? null;
}

/** Reads the remembered guest name cookie (server-side). */
export async function getPysGuestNameFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PYS_GUEST_NAME_COOKIE)?.value ?? null;
}

/**
 * Resolves a passcode against every shareable project source:
 *   1. KanbanBoard.passCode (custom code set by the owner)
 *   2. KanbanBoard title   (deterministic code, e.g. PETY-8941)
 *   3. MULTI_TASK Task title
 *   4. MULTI_TASK SkillPet title
 */
async function resolveProjectByPassCode(
  code: string
): Promise<ResolvedProject | null> {
  // --- Kanban boards (custom passCode or deterministic title code) ---
  const boards = await prisma.kanbanBoard.findMany({
    include: { domain: true },
  });
  for (const board of boards) {
    const matchesCustom = passCodesMatch(board.passCode, code);
    const matchesDerived = passCodesMatch(
      computeProjectPassCode(board.title),
      code
    );
    if (matchesCustom || matchesDerived) {
      return {
        id: board.id,
        title: board.title,
        type: "BOARD",
        passCode: board.passCode || computeProjectPassCode(board.title),
        domainAccentColor: board.domain?.accentColor ?? null,
        domainAvatarSpecies: board.domain?.avatarSpecies ?? null,
      };
    }
  }

  // --- Multi-task project tasks (filtered in JS to avoid JSON-filter edge cases) ---
  const tasks = await prisma.task.findMany({
    include: { domain: true },
  });
  for (const task of tasks) {
    const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
    const isMultiTask =
      rc?.engine === "MULTI_TASK" || rc?.frequency === "multi_task";
    if (!isMultiTask) continue;
    if (passCodesMatch(computeProjectPassCode(task.title), code)) {
      return {
        id: task.id,
        title: task.title,
        type: "TASK",
        passCode: computeProjectPassCode(task.title),
        domainAccentColor: task.domain?.accentColor ?? null,
        domainAvatarSpecies: task.domain?.avatarSpecies ?? null,
      };
    }
  }

  // --- Multi-task skill pets ---
  const pets = await prisma.skillPet.findMany({
    where: { planningEngineType: "MULTI_TASK" },
    include: { domain: true },
  });
  for (const pet of pets) {
    if (passCodesMatch(computeProjectPassCode(pet.title), code)) {
      return {
        id: pet.id,
        title: pet.title,
        type: "PET",
        passCode: computeProjectPassCode(pet.title),
        domainAccentColor: pet.domain?.accentColor ?? null,
        domainAvatarSpecies: pet.domain?.avatarSpecies ?? null,
      };
    }
  }

  return null;
}

/** Demo-mode fallback: resolve the passcode against bundled mock data. */
function resolveMockProjectByPassCode(code: string): ResolvedProject | null {
  for (const domain of INITIAL_DOMAINS) {
    for (const pet of domain.skillPets ?? []) {
      if (pet.planningEngineType !== "MULTI_TASK") continue;
      if (passCodesMatch(computeProjectPassCode(pet.title), code)) {
        return {
          id: pet.id,
          title: pet.title,
          type: "PET",
          passCode: computeProjectPassCode(pet.title),
          domainAccentColor: domain.accentColor,
          domainAvatarSpecies: domain.avatarSpecies,
        };
      }
    }
  }
  for (const task of INITIAL_TASKS) {
    const engine = task.repeatConfig?.engine;
    if (engine !== "MULTI_TASK") continue;
    if (passCodesMatch(computeProjectPassCode(task.title), code)) {
      const domain = INITIAL_DOMAINS.find((d) => d.id === task.domainId);
      return {
        id: task.id,
        title: task.title,
        type: "TASK",
        passCode: computeProjectPassCode(task.title),
        domainAccentColor: domain?.accentColor ?? null,
        domainAvatarSpecies: domain?.avatarSpecies ?? null,
      };
    }
  }
  return null;
}

/**
 * Validates a project passkey and creates (or reuses) an anonymous guest
 * session scoped to exactly one shared project. The guest sees only that
 * project's board — never the host's other domains, habits, or pets.
 * When guestName is provided, it is stored as their callSign so they are
 * identified across comments, cards, and future project interactions.
 */
export async function joinProjectWithPasskeyAction(
  passCode: string,
  guestName?: string
): Promise<JoinProjectResult> {
  const code = passCode?.trim() ?? "";
  const cleanName = guestName?.trim() || "Guest Collaborator";

  if (!isValidPassCodeFormat(code)) {
    return {
      success: false,
      error: "Invalid passkey format. Expected something like CYS-8941.",
    };
  }

  try {
    const project = await resolveProjectByPassCode(code);
    if (!project) {
      return {
        success: false,
        error:
          "No shared project matches this passkey. Double-check the code with your host.",
      };
    }

    // Reuse the existing anonymous session when the same browser re-joins
    // the same project (avoids creating duplicate guest records).
    const cookieStore = await cookies();
    const existingUid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
    if (existingUid) {
      const existing = await prisma.user
        .findUnique({ where: { id: existingUid } })
        .catch(() => null);
      if (existing?.isAnonymous && existing.sharedProjectId === project.id) {
        if (cleanName && cleanName !== "Guest Collaborator" && existing.callSign !== cleanName) {
          await prisma.user
            .update({
              where: { id: existing.id },
              data: { callSign: cleanName },
            })
            .catch(() => null);
        }
        await setGuestCookies(existing.id, project.id, cleanName !== "Guest Collaborator" ? cleanName : existing.callSign);
        return {
          success: true,
          project: {
            id: project.id,
            title: project.title,
            type: project.type,
            passCode: project.passCode,
          },
        };
      }
    }

    // Create the anonymous collaborator account
    const guestEmail = `guest-${normalizePassCode(code).toLowerCase()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@guest.petyourskills.local`;

    const guest = await prisma.user.create({
      data: {
        email: guestEmail,
        callSign: cleanName,
        rankTier: 1,
        totalXp: 0,
        isAnonymous: true,
        sharedProjectId: project.id,
      },
    });

    // Durable membership link for board-type projects so access survives
    // the upgrade to a full account.
    if (project.type === "BOARD") {
      await prisma.boardMember
        .upsert({
          where: {
            boardId_userId: { boardId: project.id, userId: guest.id },
          },
          update: { role: "EDITOR" },
          create: { boardId: project.id, userId: guest.id, role: "EDITOR" },
        })
        .catch(() => {});
    }

    await setGuestCookies(guest.id, project.id, cleanName);

    return {
      success: true,
      project: {
        id: project.id,
        title: project.title,
        type: project.type,
        passCode: project.passCode,
      },
    };
  } catch (error) {
    console.error(
      "[joinProjectWithPasskeyAction] DB unavailable, trying demo fallback:",
      error
    );

    // Demo / offline mode: resolve against bundled mock data so the flow
    // remains testable without a database connection.
    const mockProject = resolveMockProjectByPassCode(code);
    if (!mockProject) {
      return {
        success: false,
        error:
          "No shared project matches this passkey. Double-check the code with your host.",
      };
    }

    await setGuestCookies(
      `guest-demo-${normalizePassCode(code).toLowerCase()}`,
      mockProject.id,
      cleanName
    );

    return {
      success: true,
      project: {
        id: mockProject.id,
        title: mockProject.title,
        type: mockProject.type,
        passCode: mockProject.passCode,
      },
    };
  }
}

/**
 * Updates the display name for the current guest user and persists it in cookie and DB.
 */
export async function updateGuestNameAction(
  name: string
): Promise<{ success: boolean; name?: string; error?: string }> {
  const cleanName = name?.trim();
  if (!cleanName || cleanName.length < 1) {
    return { success: false, error: "Name cannot be empty." };
  }
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
    if (uid) {
      await prisma.user
        .update({
          where: { id: uid },
          data: { callSign: cleanName },
        })
        .catch(() => null);
    }
    const opts = {
      httpOnly: false,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };
    cookieStore.set(PYS_GUEST_NAME_COOKIE, cleanName, opts);
    return { success: true, name: cleanName };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Adds a card to a shared project board as a collaborator.
 *
 * Security model:
 *  - Anonymous guests may only add to the project their session is scoped to.
 *  - Full users must hold a BoardMember record for the board.
 *  - The REAL owning domain is always resolved server-side — the synthetic
 *    client-side "dom-shared-*" id is never trusted (it doesn't exist in the
 *    DB, which is why generic task creation failed for guests).
 *
 * Returns only the new task id (no host metadata leaks to the guest client).
 */
export async function addSharedProjectTaskAction(data: {
  projectId: string;
  title: string;
  description?: string | null;
  columnId?: "TODO" | "IN_PROGRESS" | "DONE";
  xpReward?: number;
  estimatedMinutes?: number | null;
  assignee?: { id: string; name: string } | null;
}): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const title = data.title?.trim();
    if (!title) return { success: false, error: "Title is required" };

    const cookieStore = await cookies();
    const uid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
    if (!uid) return { success: false, error: "No active session" };

    const user = await prisma.user
      .findUnique({ where: { id: uid } })
      .catch(() => null);
    if (!user) return { success: false, error: "Unknown user" };

    // --- Authorization ---
    let authorized = false;
    if (user.isAnonymous) {
      authorized = user.sharedProjectId === data.projectId;
    } else {
      const membership = await prisma.boardMember
        .findUnique({
          where: {
            boardId_userId: { boardId: data.projectId, userId: user.id },
          },
        })
        .catch(() => null);
      authorized = !!membership;
    }
    if (!authorized) {
      return { success: false, error: "Not a collaborator on this project" };
    }

    // --- Resolve the real owning domain for the project ---
    let domainId: string | null = null;

    const board = await prisma.kanbanBoard
      .findUnique({ where: { id: data.projectId }, include: { domain: true } })
      .catch(() => null);

    if (board) {
      domainId = board.domainId;
      if (!domainId) {
        // Board not linked to a domain — fall back to the owner's first domain
        const ownerDomain = await prisma.lifeDomain
          .findFirst({
            where: { userId: board.ownerId, isActive: true },
            orderBy: { createdAt: "asc" },
          })
          .catch(() => null);
        domainId = ownerDomain?.id ?? null;
      }
    } else {
      const rootTask = await prisma.task
        .findUnique({ where: { id: data.projectId } })
        .catch(() => null);
      if (rootTask) {
        domainId = rootTask.domainId;
      } else {
        const pet = await prisma.skillPet
          .findUnique({ where: { id: data.projectId } })
          .catch(() => null);
        domainId = pet?.domainId ?? null;
      }
    }

    if (!domainId) {
      return { success: false, error: "Could not resolve the project domain" };
    }

    const siblingCount = await prisma.task
      .count({ where: { boardId: data.projectId } })
      .catch(() => 0);

    const created = await prisma.task.create({
      data: {
        domainId,
        boardId: data.projectId,
        title: title.slice(0, 300),
        description: data.description || null,
        columnId: data.columnId ?? "TODO",
        isCompleted: (data.columnId ?? "TODO") === "DONE",
        doneAt: (data.columnId ?? "TODO") === "DONE" ? new Date() : null,
        xpReward: data.xpReward ?? 30,
        estimatedMinutes: data.estimatedMinutes ?? 25,
        sortOrder: siblingCount + 1,
      },
    });

    return { success: true, taskId: created.id };
  } catch (error) {
    console.error("[addSharedProjectTaskAction] error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Returns the current card list for a shared project board. Used by the
 * client-side board poller so host and guests see each other's changes
 * without refreshing.
 *
 * Authorization: anonymous guests must be scoped to the project; full users
 * must own the project or hold a BoardMember record. Guest responses have
 * domainId/boardId remapped to their synthetic scoped workspace.
 */
export async function syncSharedProjectTasksAction(data: {
  projectId: string;
}): Promise<{ success: boolean; tasks?: TaskItem[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
    if (!uid) return { success: false, error: "No active session" };

    const user = await prisma.user
      .findUnique({ where: { id: uid } })
      .catch(() => null);
    if (!user) return { success: false, error: "Unknown user" };

    const project = await resolveSharedProjectById(data.projectId).catch(
      () => null
    );
    if (!project) return { success: false, error: "Project not found" };

    let authorized = false;
    if (user.isAnonymous) {
      authorized = user.sharedProjectId === data.projectId;
    } else if (project.ownerUserId === user.id) {
      authorized = true;
    } else {
      const membership = await prisma.boardMember
        .findUnique({
          where: {
            boardId_userId: { boardId: data.projectId, userId: user.id },
          },
        })
        .catch(() => null);
      authorized = !!membership;
    }
    if (!authorized) {
      return { success: false, error: "Not a collaborator on this project" };
    }

    if (user.isAnonymous) {
      // Remap to the guest's synthetic scoped workspace (privacy + the guest
      // client's board filter only knows the scoped project id).
      const domainId = `dom-shared-${project.id.slice(0, 12)}`;
      return {
        success: true,
        tasks: project.tasks.map((t) => ({
          ...t,
          domainId,
          boardId: project.id,
        })),
      };
    }

    return { success: true, tasks: project.tasks };
  } catch (error) {
    console.error("[syncSharedProjectTasksAction] error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Returns info about the current anonymous guest session. Used by the
 * sign-up page to render an upgrade banner and by the dashboard seed
 * fallback to reconstruct a demo guest workspace.
 */
export async function getGuestSessionInfoAction(): Promise<GuestSessionInfo> {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get(PYS_UID_COOKIE)?.value ?? null;
    const sharedId = cookieStore.get(PYS_SHARED_COOKIE)?.value ?? null;

    if (!uid) return { isGuest: false };

    // Demo guest (no DB record)
    if (uid.startsWith("guest-demo-")) {
      return { isGuest: true, projectId: sharedId ?? undefined };
    }

    const user = await prisma.user
      .findUnique({ where: { id: uid } })
      .catch(() => null);
    if (!user?.isAnonymous) return { isGuest: false };

    const projectId = user.sharedProjectId ?? sharedId ?? undefined;
    let projectTitle: string | undefined;

    if (projectId) {
      const board = await prisma.kanbanBoard
        .findUnique({ where: { id: projectId }, select: { title: true } })
        .catch(() => null);
      if (board) {
        projectTitle = board.title;
      } else {
        const task = await prisma.task
          .findUnique({ where: { id: projectId }, select: { title: true } })
          .catch(() => null);
        if (task) {
          projectTitle = task.title;
        } else {
          const pet = await prisma.skillPet
            .findUnique({ where: { id: projectId }, select: { title: true } })
            .catch(() => null);
          projectTitle = pet?.title;
        }
      }
    }

    return { isGuest: true, projectId, projectTitle };
  } catch {
    return { isGuest: false };
  }
}
