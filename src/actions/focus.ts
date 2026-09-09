"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordFocusSessionAction(data: {
  taskId?: string | null;
  durationSeconds: number;
  verifiedXp: number;
  startedAt: string;
}) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "commander@agency.dev" },
    });

    if (!user) throw new Error("User not found");

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.focusSession.create({
        data: {
          userId: user.id,
          taskId: data.taskId || null,
          durationSeconds: data.durationSeconds,
          verifiedXp: data.verifiedXp,
          startedAt: new Date(data.startedAt),
          completedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
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
