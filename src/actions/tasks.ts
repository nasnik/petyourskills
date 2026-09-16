"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getPysUidFromCookie } from "@/actions/auth";
import { SkillRepeatConfig, TaskItem, LifeDomainItem } from "@/types";

function isDailyRoutineTask(task: TaskItem): boolean {
  const rc = task.repeatConfig as { engine?: string; frequency?: string } | null;
  return rc?.engine === "DAILY_ROUTINE" || rc?.frequency === "daily";
}

function isSameDay(date1: Date | string | null | undefined, date2: Date): boolean {
  if (!date1) return false;
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  return (
    d1.getFullYear() === date2.getFullYear() &&
    d1.getMonth() === date2.getMonth() &&
    d1.getDate() === date2.getDate()
  );
}

async function resetDailyRoutineTasks(
  tasks: TaskItem[],
  domains: LifeDomainItem[],
  userId: string
): Promise<{ tasks: TaskItem[]; domains: LifeDomainItem[] }> {
  const today = new Date();
  const tasksToReset = tasks.filter(
    (t) => t.isCompleted && isDailyRoutineTask(t) && !isSameDay(t.doneAt, today)
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

  for (const task of tasksToReset) {
    const domain = domains.find((d) => d.id === task.domainId);
    if (domain) {
      await prisma.lifeDomain.update({
        where: { id: domain.id },
        data: { currentXp: { decrement: task.xpReward } },
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { totalXp: { decrement: task.xpReward } },
    });
  }

  const updatedTasks = tasks.map((t) => {
    const resetTask = tasksToReset.find((rt) => rt.id === t.id);
    if (resetTask) {
      return { ...t, isCompleted: false, columnId: "TODO" as const, doneAt: null };
    }
    return t;
  });

  const updatedDomains = domains.map((d) => {
    const domainTasks = tasksToReset.filter((t) => t.domainId === d.id);
    if (domainTasks.length === 0) return d;
    const xpLost = domainTasks.reduce((sum, t) => sum + t.xpReward, 0);
    return { ...d, currentXp: Math.max(0, d.currentXp - xpLost) };
  });

  return { tasks: updatedTasks, domains: updatedDomains };
}

export async function getDashboardDataAction() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "commander@agency.dev" },
      include: {
        domains: {
          include: {
            skillPets: true,
          },
        },
      },
    });

    const tasks = await prisma.task.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        domain: true,
      },
    });

    const mappedTasks: TaskItem[] = tasks.map((t) => ({
      id: t.id,
      domainId: t.domainId,
      boardId: t.boardId,
      title: t.title,
      description: t.description || null,
      columnId: t.columnId as TaskItem["columnId"],
      isCompleted: t.isCompleted,
      doneAt: t.doneAt ? t.doneAt.toISOString() : null,
      xpReward: t.xpReward,
      estimatedMinutes: t.estimatedMinutes,
      repeatConfig: t.repeatConfig as TaskItem["repeatConfig"],
      sortOrder: t.sortOrder,
    }));

    const mappedDomains: LifeDomainItem[] = user?.domains.map((d) => ({
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
        planningEngineType: p.planningEngineType as "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE",
      })),
    })) ?? [];

    if (user?.id) {
      const { tasks: resetTasks } = await resetDailyRoutineTasks(
        mappedTasks,
        mappedDomains,
        user.id
      );
      return { user, tasks: resetTasks };
    }

    return { user, tasks: mappedTasks };
  } catch (error) {
    console.error("Failed to fetch dashboard data from Neon:", error);
    return null;
  }
}

export async function toggleTaskCompleteAction(taskId: string, doneAt?: string | null) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");

    const isCompleted = !task.isCompleted;
    const xpDiff = isCompleted ? task.xpReward : -task.xpReward;

    // Transaction: update task status + credit user & domain XP
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          isCompleted,
          columnId: isCompleted ? "DONE" : "TODO",
          doneAt: isCompleted ? (doneAt ? new Date(doneAt) : new Date()) : null,
        },
      });

      const domain = await tx.lifeDomain.update({
        where: { id: task.domainId },
        data: {
          currentXp: { increment: xpDiff },
        },
      });

      // Credit XP to the actual owner of this domain
      if (domain.userId) {
        await tx.user.update({
          where: { id: domain.userId },
          data: {
            totalXp: { increment: xpDiff },
          },
        });
      }

      return updatedTask;
    });

    revalidatePath("/dashboard");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error toggling task complete in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function createTaskAction(data: {
  domainId?: string;
  domainSlug?: string;
  domainName?: string;
  domainColor?: string;
  avatarSpecies?: string;
  boardId?: string | null;
  title: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  xpReward?: number;
  planningEngine?: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
  repeatConfig?: SkillRepeatConfig | null;
  createCompanionPet?: boolean;
  assignee?: { id: string; name: string } | null;
}) {
  try {
    let resolvedDomainId = data.domainId;
    let domainRecord = null;

    // 1. If domainId provided, check if domain exists
    if (resolvedDomainId) {
      domainRecord = await prisma.lifeDomain.findUnique({
        where: { id: resolvedDomainId },
      });
    }

    // 2. If domain doesn't exist by ID, resolve user and look up / create domain
    if (!domainRecord) {
      const uid = await getPysUidFromCookie();
      let user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;

      if (!user) {
        try {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          if (authUser?.email) {
            user = await prisma.user.findUnique({ where: { email: authUser.email } });
          }
        } catch {}
      }

      if (!user) {
        user = await prisma.user.findFirst({
          where: { email: "commander@agency.dev" },
        });
      }

      if (!user) {
        return { success: false, error: "User session not found." };
      }

      const slug = data.domainSlug || "custom";
      const name = data.domainName || (slug === "custom" ? "Custom Domain" : slug);
      const color = data.domainColor || "#10B981";
      const avatar = data.avatarSpecies || "Vitality Wolf";

      // Check if user already has an active domain with this slug
      domainRecord = await prisma.lifeDomain.findFirst({
        where: { userId: user.id, slug },
      });

      if (!domainRecord) {
        const newDomainId = `dom-${slug}-${user.id.slice(0, 8)}-${Date.now()}`;
        domainRecord = await prisma.lifeDomain.create({
          data: {
            id: newDomainId,
            userId: user.id,
            name,
            slug,
            accentColor: color,
            avatarSpecies: avatar,
            level: 1,
            currentXp: 0,
            isActive: true,
          },
        });
      } else if (data.avatarSpecies && domainRecord.avatarSpecies !== data.avatarSpecies) {
        domainRecord = await prisma.lifeDomain.update({
          where: { id: domainRecord.id },
          data: { avatarSpecies: data.avatarSpecies },
        });
      }

      resolvedDomainId = domainRecord.id;
    } else if (data.avatarSpecies && domainRecord.avatarSpecies !== data.avatarSpecies) {
      domainRecord = await prisma.lifeDomain.update({
        where: { id: domainRecord.id },
        data: { avatarSpecies: data.avatarSpecies },
      });
    }

    if (!resolvedDomainId) {
      return { success: false, error: "Unable to resolve target domain." };
    }

    const repeatConfigPayload = data.repeatConfig || (data.planningEngine ? { engine: data.planningEngine } : undefined);

    const newTask = await prisma.task.create({
      data: {
        domainId: resolvedDomainId,
        boardId: data.boardId || null,
        title: data.title,
        description: data.description || null,
        columnId: "TODO",
        isCompleted: false,
        xpReward: data.xpReward || 25,
        estimatedMinutes: data.estimatedMinutes || null,
        repeatConfig: (repeatConfigPayload as any) || undefined,
      },
    });

    if (data.createCompanionPet || data.planningEngine) {
      const petId = `pet-${resolvedDomainId}-${Date.now()}`;
      await prisma.skillPet.create({
        data: {
          id: petId,
          domainId: resolvedDomainId,
          title: data.title,
          level: 1,
          currentXp: 0,
          nextEvolutionThreshold: 1000,
          planningEngineType: data.planningEngine || "DAILY_ROUTINE",
        },
      });
    }

    // If this is a multi-task project, create starter project tasks on its board
    if (data.planningEngine === "MULTI_TASK" && !data.boardId) {
      try {
        await prisma.task.createMany({
          data: [
            {
              domainId: resolvedDomainId,
              boardId: newTask.id,
              title: `Milestone 1: Project Scope & Setup`,
              columnId: "TODO",
              isCompleted: false,
              xpReward: 30,
              estimatedMinutes: 25,
              sortOrder: 1,
            },
            {
              domainId: resolvedDomainId,
              boardId: newTask.id,
              title: `Milestone 2: Core Implementation Sprint`,
              columnId: "IN_PROGRESS",
              isCompleted: false,
              xpReward: 50,
              estimatedMinutes: 45,
              sortOrder: 2,
            },
            {
              domainId: resolvedDomainId,
              boardId: newTask.id,
              title: `Milestone 3: Quality Review & Testing`,
              columnId: "REVIEW",
              isCompleted: false,
              xpReward: 35,
              estimatedMinutes: 20,
              sortOrder: 3,
            },
          ],
        });
      } catch (err) {
        console.warn("Could not create starter project tasks:", err);
      }
    }

    revalidatePath("/dashboard");
    return { success: true, task: newTask, domain: domainRecord };
  } catch (error) {
    console.error("Error creating task in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true };
  } catch {
    // If not found in task table, check skillPet table
    try {
      await prisma.skillPet.delete({
        where: { id: taskId },
      });
      revalidatePath("/dashboard");
      revalidatePath("/calendar");
      return { success: true };
    } catch (petErr) {
      console.error("Error deleting task/skillPet in Neon:", petErr);
      return { success: false, error: String(petErr) };
    }
  }
}

export async function updateTaskRepeatConfigAction(
  taskId: string,
  repeatConfig: SkillRepeatConfig
) {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        repeatConfig: repeatConfig as any,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error updating task repeatConfig in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function createSkillPetAction(data: {
  domainId: string;
  title: string;
  planningEngineType?: "DAILY_ROUTINE" | "MULTI_TASK" | "CUSTOM_SCHEDULE" | "SPECIFIC_DATE";
}) {
  try {
    const petId = `pet-${data.domainId}-${Date.now()}`;
    const newPet = await prisma.skillPet.create({
      data: {
        id: petId,
        domainId: data.domainId,
        title: data.title,
        level: 1,
        currentXp: 0,
        nextEvolutionThreshold: 1000,
        planningEngineType: data.planningEngineType || "DAILY_ROUTINE",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, skillPet: newPet };
  } catch (error) {
    console.error("Error creating skill pet in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateTaskColumnAction(taskId: string, columnId: string) {
  try {
    const isCompleted = columnId === "DONE";
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId,
        isCompleted,
        doneAt: isCompleted ? new Date() : null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error updating task column in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateTaskAssigneeAction(taskId: string, assignee: { id: string; name: string } | null) {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignee: assignee as any,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error updating task assignee in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateTaskDescriptionAction(taskId: string, description: string | null) {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { description },
    });
    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    return { success: true, description: updated.description };
  } catch (error) {
    console.error("Error updating task description in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function addTaskCommentAction(
  taskId: string,
  body: string
): Promise<{ success: boolean; comment?: unknown; error?: string }> {
  try {
    // Resolve user from cookie
    const uid = await getPysUidFromCookie();
    let userId = uid;
    if (!userId) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const user = await prisma.user.findUnique({ where: { email: authUser.email } });
          if (user) userId = user.id;
        }
      } catch {}
    }
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        body: body.trim(),
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    return { success: true, comment };
  } catch (error) {
    console.error("Error adding task comment in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function getTaskCommentsAction(taskId: string): Promise<{ success: boolean; comments?: unknown[]; error?: string }> {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            callSign: true,
          },
        },
      },
    });
    return { success: true, comments: comments.map((c: any) => ({
      id: c.id,
      taskId: c.taskId,
      userId: c.userId,
      userName: c.user.callSign,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })) };
  } catch (error) {
    console.error("Error fetching task comments in Neon:", error);
    return { success: false, error: String(error) };
  }
}
