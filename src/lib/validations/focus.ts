import { z } from "zod";

export const startFocusSessionSchema = z.object({
  taskId: z.string().optional().nullable(),
  durationSeconds: z.number().int().min(60).max(14400), // 1 min to 4 hours
});

export const completeFocusSessionSchema = z.object({
  sessionId: z.string().optional(),
  taskId: z.string().optional().nullable(),
  durationSeconds: z.number().int().min(60).max(14400),
  startedAt: z.string().datetime().or(z.string()),
  completedAt: z.string().datetime().or(z.string()),
});
