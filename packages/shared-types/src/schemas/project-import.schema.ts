import { z } from 'zod';
import { CreateFieldSchema } from './field.schema';
import { CreateIndexSchema } from './index.schema';
import { ProjectSchema } from './project.schema';
import { CreateTableSchema } from './table.schema';

/** Campo como exportado pelo SXGerador (Create + metadados Prisma). */
export const ImportFieldRowSchema = CreateFieldSchema.and(
  z.object({
    id: z.string().cuid(),
    tableId: z.string().cuid(),
    order: z
      .string()
      .trim()
      .regex(/^\d{2}$/, 'Ordem do campo deve ter 2 dígitos'),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable().optional(),
  }),
);

/** Índice como exportado. */
export const ImportIndexRowSchema = CreateIndexSchema.and(
  z.object({
    id: z.string().cuid(),
    tableId: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable().optional(),
  }),
);

/** Tabela + aninhados como exportado. */
export const ImportTableRowSchema = CreateTableSchema.and(
  z.object({
    id: z.string().cuid(),
    projectId: z.string().cuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable().optional(),
    fields: z.array(ImportFieldRowSchema),
    indexes: z.array(ImportIndexRowSchema),
  }),
);

export const ProjectImportDocumentSchema = z.object({
  format: z.literal('sxgerador-project'),
  formatVersion: z.literal(1),
  exportedAt: z.string().min(1),
  project: ProjectSchema,
  tables: z.array(ImportTableRowSchema),
});

export const ImportPreviewBodySchema = z.object({
  document: z.unknown(),
});

export const ImportApplyBodySchema = z.object({
  document: z.unknown(),
  options: z
    .object({
      /** Se true, remove (soft) campos/índices/tabelas ativos que não existem no JSON. */
      syncDeletions: z.boolean().optional(),
    })
    .optional(),
});

export type ProjectImportDocument = z.infer<typeof ProjectImportDocumentSchema>;
export type ImportPreviewBody = z.infer<typeof ImportPreviewBodySchema>;
export type ImportApplyBody = z.infer<typeof ImportApplyBodySchema>;
