import { z } from 'zod';

export const CompareProjectsBodySchema = z.object({
  projectIdA: z.string().cuid(),
  projectIdB: z.string().cuid(),
});

export const CompareMigrationsBodySchema = z.object({
  projectId: z.string().cuid(),
  migrationIdA: z.string().cuid(),
  migrationIdB: z.string().cuid(),
});

export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  operation: z.string().trim().optional(),
  authorId: z.string().cuid().optional(),
  tablePrefix: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z0-9]{3}$/)
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CompareProjectsBody = z.infer<typeof CompareProjectsBodySchema>;
export type CompareMigrationsBody = z.infer<typeof CompareMigrationsBodySchema>;
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;
