import { z } from "zod";

export const createTaskSchema = z.object({
  domainId: z.string().uuid().or(z.string().min(1)),
  boardId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Task title is required").max(120),
  columnId: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  xpReward: z.number().int().min(5).max(1000).default(25),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
});

export const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120).optional(),
  columnId: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  isCompleted: z.boolean().optional(),
  xpReward: z.number().int().optional(),
  estimatedMinutes: z.number().int().nullable().optional(),
});
