import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculateUserRank } from "@/lib/gamification/xp-engine";
import { LifeDomainItem, TaskItem, UserProfile, FocusSessionItem } from "@/types";
import { INITIAL_USER_PROFILE, INITIAL_DOMAINS, INITIAL_TASKS } from "@/lib/mock-data";
import { getPysUidFromCookie } from "@/actions/auth";
import { getPysSharedFromCookie } from "@/actions/collaboration";
import {
  mapDbTask,
  resolveSharedProjectById,
  type SharedProjectWithTasks,
} from "@/lib/shared-project";

import { isDailyPlanQuest, isSameDay } from "@/lib/schedule-utils";

async function resetDailyRoutineTasks(
  tasks: TaskItem[],
  domains: LifeDomainItem[],
  userId: string
): Promise<{ tasks: TaskItem[]; domains: LifeDomainItem[] }> {
  const today = new Date();
  const tasksToReset = tasks.filter(
    (t) => t.isCompleted && isDailyPlanQuest(t) && !isSameDay(t.doneAt, today)
  );

  if (tasksToReset.length === 0) {
    return { tasks, domains };
  }

  const taskIds = tasksToReset.map((t) => t.id);

  await prisma.task.updateMany({
    where: { id: { in: taskIds } },
    data: {
      isCompleted: false,
      columnId: "TODO",
      doneAt: null,
    },
  });

  // Daily quest resets reset the daily checklist for the new day so the user can
  // dedicate time and earn XP again today. Earned lifetime XP is preserved.

  const updatedTasks = tasks.map((t) => {
    const resetTask = tasksToReset.find((rt) => rt.id === t.id);
    if (resetTask) {
      return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
    }
    return t;
  });

  return { tasks: updatedTasks, domains };
}

function resetDailyRoutineTasksClient(
  tasks: TaskItem[],
  domains: LifeDomainItem[]
): { tasks: TaskItem[]; domains: LifeDomainItem[] } {
  const today = new Date();
  const tasksToReset = tasks.filter(
    (t) => t.isCompleted && isDailyPlanQuest(t) && !isSameDay(t.doneAt, today)
  );

  if (tasksToReset.length === 0) {
    return { tasks, domains };
  }

  const updatedTasks = tasks.map((t) => {
    const resetTask = tasksToReset.find((rt) => rt.id === t.id);
    if (resetTask) {
      return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
    }
    return t;
  });

  return { tasks: updatedTasks, domains };
}

export interface DashboardSeedData {
  user: UserProfile;
  domains: LifeDomainItem[];
  tasks: TaskItem[];
  focusSessions: FocusSessionItem[];
}
/**
 * Builds a scoped workspace for a shared project: ONE synthetic domain that
 * contains only the shared project and its board tasks. Task domainIds are
 * remapped to the synthetic domain so no host domain data is referenced.
 */
function buildSharedWorkspace(
  userId: string,
  project: SharedProjectWithTasks
): { domains: LifeDomainItem[]; tasks: TaskItem[] } {
  const domainId = `dom-shared-${project.id.slice(0, 12)}`;
  const domain: LifeDomainItem = {
    id: domainId,
    userId,
    name: project.title,
    slug: "shared",
    accentColor: project.accentColor,
    avatarSpecies: project.avatarSpecies,
    level: 1,
    currentXp: 0,
    isActive: true,
    // Synthetic MULTI_TASK pet so the project renders in the sidebar and the
    // ProjectKanbanBoard can resolve its title/domain metadata.
    skillPets: [
      {
        id: project.id,
        domainId,
        title: project.title,
        level: 1,
        currentXp: 0,
        nextEvolutionThreshold: 1000,
        planningEngineType: "MULTI_TASK",
      },
    ],
  };
  // Remap domainId to the synthetic domain AND normalize boardId to the
  // scoped project id — cards may be stored under a twin pet/root-task id,
  // but the client's board filter only knows the scoped id.
  const tasks = project.tasks.map((t) => ({
    ...t,
    domainId,
    boardId: project.id,
  }));
  return { domains: [domain], tasks };
}

function buildGuestUserProfile(
  dbUser: { id: string; email: string; callSign: string },
  sharedProjectId: string
): UserProfile {
  return {
    id: dbUser.id,
    email: dbUser.email,
    callSign: dbUser.callSign || "Guest Collaborator",
    rankTier: 1,
    rankTitle: "Guest",
    totalXp: 0,
    tierProgress: 0,
    nextTierXp: 100,
    isAnonymous: true,
    sharedProjectId,
  };
}

/**
 * Demo-mode guest workspace built from bundled mock data when no database
 * is reachable (e.g. the CYS-8941 demo passkey).
 */
function buildMockGuestSeedData(
  uid: string,
  sharedProjectId: string | null
): DashboardSeedData | null {
  if (!sharedProjectId) return null;

  let project: SharedProjectWithTasks | null = null;

  for (const domain of INITIAL_DOMAINS) {
    const pet = (domain.skillPets ?? []).find((p) => p.id === sharedProjectId);
    if (pet) {
      project = {
        id: pet.id,
        title: pet.title,
        type: "PET",
        accentColor: domain.accentColor,
        avatarSpecies: domain.avatarSpecies,
        ownerUserId: null,
        tasks: INITIAL_TASKS.filter((t) => t.boardId === pet.id),
      };
      break;
    }
  }

  if (!project) {
    const root = INITIAL_TASKS.find((t) => t.id === sharedProjectId);
    if (root) {
      const domain = INITIAL_DOMAINS.find((d) => d.id === root.domainId);
      project = {
        id: root.id,
        title: root.title,
        type: "TASK",
        accentColor: domain?.accentColor ?? "#8B5CF6",
        avatarSpecies: domain?.avatarSpecies ?? "Byte Fox",
        ownerUserId: null,
        tasks: INITIAL_TASKS.filter((t) => t.boardId === root.id),
      };
    }
  }

  if (!project) return null;

  const { domains, tasks } = buildSharedWorkspace(uid, project);
  return {
    user: {
      id: uid,
      email: "guest@session.local",
      callSign: "Guest Collaborator",
      rankTier: 1,
      rankTitle: "Guest",
      totalXp: 0,
      tierProgress: 0,
      nextTierXp: 100,
      isAnonymous: true,
      sharedProjectId,
    },
    domains,
    tasks,
    focusSessions: [],
  };
}

/**
 * Fetches the currently authenticated user's data from the DB to seed the
 * dashboard. Tries identity sources in order:
 *   1. Supabase confirmed session (email lookup)
 *   2. pys_uid cookie set during registration / onboarding (works before email confirmation)
 * Falls back to mock data only when neither yields a DB record.
 */
export async function fetchDashboardSeedData(): Promise<DashboardSeedData> {
  try {
    // --- 1. Try Supabase confirmed session ---
    let dbUserId: string | null = null;

    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.email) {
        const found = await prisma.user.findUnique({
          where: { email: authUser.email },
          select: { id: true },
        });
        dbUserId = found?.id ?? null;
      }
    } catch {
      // Supabase unavailable — fall through to cookie
    }

    // --- 2. Fall back to pys_uid cookie (set during registerUserAction) ---
    if (!dbUserId) {
      dbUserId = await getPysUidFromCookie();
    }

    // Shared-project cookie (set when a guest joins via passkey)
    const sharedCookieProjectId = await getPysSharedFromCookie().catch(
      () => null
    );

    if (!dbUserId) {
      // Demo guest (passkey join without a database session)
      const demoGuest = buildMockGuestSeedData(
        "guest-demo",
        sharedCookieProjectId
      );
      if (demoGuest) return demoGuest;
      return { user: INITIAL_USER_PROFILE, domains: INITIAL_DOMAINS, tasks: INITIAL_TASKS, focusSessions: [] };
    }

    // --- 3. Fetch full user record with domains + tasks ---
    const dbUser = await prisma.user.findUnique({
      where: { id: dbUserId },
      include: {
        domains: {
          where: { isActive: true },
          include: {
            skillPets: true,
            tasks: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dbUser) {
      // Cookie points at a demo guest id that has no DB record
      const demoGuest = buildMockGuestSeedData(dbUserId, sharedCookieProjectId);
      if (demoGuest) return demoGuest;
      return { user: INITIAL_USER_PROFILE, domains: INITIAL_DOMAINS, tasks: INITIAL_TASKS, focusSessions: [] };
    }

    // --- 3b. Anonymous guest: scoped seed with ONLY the shared project ---
    if (dbUser.isAnonymous) {
      const sharedProjectId = dbUser.sharedProjectId ?? sharedCookieProjectId;
      const project = sharedProjectId
        ? await resolveSharedProjectById(sharedProjectId).catch(() => null)
        : null;

      if (project && sharedProjectId) {
        const workspace = buildSharedWorkspace(dbUser.id, project);
        return {
          user: buildGuestUserProfile(dbUser, sharedProjectId),
          domains: workspace.domains,
          tasks: workspace.tasks,
          focusSessions: [],
        };
      }

      // Guest without a resolvable project: minimal empty workspace
      return {
        user: buildGuestUserProfile(dbUser, sharedProjectId ?? ""),
        domains: [],
        tasks: [],
        focusSessions: [],
      };
    }

    const rank = calculateUserRank(dbUser.totalXp);

    const userProfile: UserProfile = {
      id: dbUser.id,
      email: dbUser.email,
      callSign: dbUser.callSign,
      rankTier: rank.tier,
      rankTitle: rank.title,
      totalXp: dbUser.totalXp,
      tierProgress: rank.progressPercent,
      nextTierXp: rank.maxXp,
      isAnonymous: false,
      sharedProjectId: dbUser.sharedProjectId,
    };

    let domains: LifeDomainItem[] = dbUser.domains.map((d) => ({
      id: d.id,
      userId: d.userId,
      name: d.name,
      slug: d.slug,
      accentColor: d.accentColor,
      avatarSpecies: d.avatarSpecies,
      level: d.level,
      currentXp: d.currentXp,
      isActive: d.isActive,
      skillPets: d.skillPets.map((p) => ({
        id: p.id,
        domainId: p.domainId,
        title: p.title,
        level: p.level,
        currentXp: p.currentXp,
        nextEvolutionThreshold: p.nextEvolutionThreshold,
        perks: p.perks as Record<string, unknown> | null,
        planningEngineType: p.planningEngineType as
          | "DAILY_ROUTINE"
          | "MULTI_TASK"
          | "CUSTOM_SCHEDULE"
          | "SPECIFIC_DATE",
      })),
    }));

    // If the user has no domains yet, provide a starter domain so widgets do not crash
    if (domains.length === 0) {
      domains = [
        {
          id: `dom-health-${dbUser.id.slice(0, 8)}`,
          userId: dbUser.id,
          name: "Health & Wellness",
          slug: "health",
          accentColor: "#10B981",
          avatarSpecies: "Vitality Wolf",
          level: 1,
          currentXp: 0,
          isActive: true,
          skillPets: [
            {
              id: `pet-health-${dbUser.id.slice(0, 8)}`,
              domainId: `dom-health-${dbUser.id.slice(0, 8)}`,
              title: "Vitality Wolf",
              level: 1,
              currentXp: 0,
              nextEvolutionThreshold: 1000,
              planningEngineType: "DAILY_ROUTINE",
            },
          ],
        },
      ];
    }

    const tasks: TaskItem[] = dbUser.domains.flatMap((d) =>
      d.tasks.map((t) => mapDbTask(t))
    );

    // --- 4. Append shared projects this user collaborates on ---
    // (boards joined via passkey, plus any guest-session carry-over). These
    // render as additional scoped domains BELOW the user's personal domains.
    try {
      const memberships = await prisma.boardMember.findMany({
        where: { userId: dbUser.id, board: { ownerId: { not: dbUser.id } } },
        include: {
          board: {
            include: { domain: true },
          },
        },
      });

      const appended = new Set<string>();
      for (const m of memberships) {
        appended.add(m.board.id);
        const boardTasks = await prisma.task
          .findMany({
            where: { boardId: m.board.id },
            orderBy: { sortOrder: "asc" },
          })
          .catch(() => [] as { id: string }[]);
        const workspace = buildSharedWorkspace(dbUser.id, {
          id: m.board.id,
          title: m.board.title,
          type: "BOARD",
          accentColor: m.board.domain?.accentColor ?? "#10B981",
          avatarSpecies: m.board.domain?.avatarSpecies ?? "Aegis Turtle",
          ownerUserId: m.board.ownerId,
          tasks: (boardTasks as Parameters<typeof mapDbTask>[0][]).map(mapDbTask),
        });
        domains = [...domains, ...workspace.domains];
        tasks.push(...workspace.tasks);
      }

      // Carry-over from a guest session on a task/pet project (no board row)
      if (dbUser.sharedProjectId && !appended.has(dbUser.sharedProjectId)) {
        const project = await resolveSharedProjectById(
          dbUser.sharedProjectId
        ).catch(() => null);
        if (project) {
          const workspace = buildSharedWorkspace(dbUser.id, project);
          domains = [...domains, ...workspace.domains];
          tasks.push(...workspace.tasks);
        }
      }
    } catch (sharedErr) {
      console.error(
        "[fetchDashboardSeedData] shared-project append failed:",
        sharedErr
      );
    }

    const { tasks: resetTasks, domains: resetDomains } = await resetDailyRoutineTasks(
      tasks,
      domains,
      dbUser.id
    );

    // --- 5. Fetch focus sessions ---
    const dbFocusSessions = await prisma.focusSession.findMany({
      where: { userId: dbUser.id },
      include: { task: true },
      orderBy: { completedAt: "desc" },
    });

    const focusSessions: FocusSessionItem[] = dbFocusSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      taskId: s.taskId,
      durationSeconds: s.durationSeconds,
      verifiedXp: s.verifiedXp,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt.toISOString(),
      task: s.task ? mapDbTask(s.task) : null,
    }));

    return { user: userProfile, domains: resetDomains, tasks: resetTasks, focusSessions };
  } catch (err) {
    console.error("[fetchDashboardSeedData] error, falling back to mock data:", err);
    // Last-resort demo guest workspace (passkey join without a database)
    try {
      const sharedCookieProjectId = await getPysSharedFromCookie().catch(
        () => null
      );
      const demoGuest = buildMockGuestSeedData(
        "guest-demo",
        sharedCookieProjectId
      );
      if (demoGuest) {
        const { tasks, domains } = resetDailyRoutineTasksClient(
          demoGuest.tasks,
          demoGuest.domains
        );
        return { ...demoGuest, tasks, domains, focusSessions: [] };
      }
    } catch {}
    const { tasks, domains } = resetDailyRoutineTasksClient(
      INITIAL_TASKS,
      INITIAL_DOMAINS
    );
    return { user: INITIAL_USER_PROFILE, domains, tasks, focusSessions: [] };
  }
}
