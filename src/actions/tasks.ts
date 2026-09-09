"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    return { user, tasks };
  } catch (error) {
    console.error("Failed to fetch dashboard data from Neon:", error);
    return null;
  }
}

export async function toggleTaskCompleteAction(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");

    const isCompleted = !task.isCompleted;
    const xpDiff = isCompleted ? task.xpReward : -task.xpReward;

    // Transaction: update task status + update user & domain XP
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          isCompleted,
          columnId: isCompleted ? "DONE" : "TODO",
          doneAt: isCompleted ? new Date() : null,
        },
      });

      await tx.user.updateMany({
        where: { email: "commander@agency.dev" },
        data: {
          totalXp: { increment: xpDiff },
        },
      });

      await tx.lifeDomain.update({
        where: { id: task.domainId },
        data: {
          currentXp: { increment: xpDiff },
        },
      });

      return updatedTask;
    });

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error toggling task complete in Neon:", error);
    return { success: false, error: String(error) };
  }
}

export async function createTaskAction(data: {
  domainId: string;
  title: string;
  estimatedMinutes?: number | null;
  xpReward?: number;
}) {
  try {
    const newTask = await prisma.task.create({
      data: {
        domainId: data.domainId,
        title: data.title,
        columnId: "TODO",
        isCompleted: false,
        xpReward: data.xpReward || 25,
        estimatedMinutes: data.estimatedMinutes || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/kanban");
    return { success: true, task: newTask };
  } catch (error) {
    console.error("Error creating task in Neon:", error);
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

    revalidatePath("/kanban");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Error updating task column in Neon:", error);
    return { success: false, error: String(error) };
  }
}
