"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFocusSessionsAction(userId: string) {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { completedAt: "desc" },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error("Error fetching focus sessions:", error);
    return { success: false, error: String(error), sessions: [] };
  }
}

export async function recordFocusSessionAction(data: {
  userId: string;
  taskId?: string | null;
  durationSeconds: number;
  verifiedXp: number;
  startedAt: string;
}) {
  try {
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.focusSession.create({
        data: {
          userId: data.userId,
          taskId: data.taskId || null,
          durationSeconds: data.durationSeconds,
          verifiedXp: data.verifiedXp,
          startedAt: new Date(data.startedAt),
          completedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: data.userId },
        data: {
          totalXp: { increment: data.verifiedXp },
        },
      });

      return newSession;
    });

    revalidatePath("/dashboard");
    revalidatePath("/growth");
    return { success: true, session };
  } catch (error) {
    console.error("Error saving focus session to Neon:", error);
    return { success: false, error: String(error) };
  }
}
