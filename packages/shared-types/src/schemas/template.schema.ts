import { z } from 'zod';
import { CreateFieldSchema, FieldOrderSchema } from './field.schema';
import { CreateIndexSchema } from './index.schema';
import { CreateTableSchema } from './table.schema';

export const TEMPLATE_CATEGORIES = ['Financeiro', 'Estoque', 'Vendas', 'RH', 'Genéricos'] as const;

export const TemplateCategorySchema = z.enum(TEMPLATE_CATEGORIES);

export const TemplateTableSnapshotSchema = CreateTableSchema;

export const TemplateFieldSnapshotSchema = CreateFieldSchema.and(
  z.object({
    order: FieldOrderSchema,
  }),
);

export const TemplateIndexSnapshotSchema = CreateIndexSchema;

export const TemplateContentSchema = z.object({
  formatVersion: z.literal(1),
  table: TemplateTableSnapshotSchema,
  fields: z.array(TemplateFieldSnapshotSchema).min(1),
  indexes: z.array(TemplateIndexSnapshotSchema).min(1),
});

export const CreateTemplateFromTableSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  category: TemplateCategorySchema,
  projectId: z.string().cuid(),
  tableId: z.string().cuid(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  category: TemplateCategorySchema,
  content: TemplateContentSchema,
});

export const ListTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  category: TemplateCategorySchema.optional(),
  search: z.string().trim().min(1).optional(),
  officialOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
});

export const ApplyTemplatePreviewBodySchema = z.object({
  projectId: z.string().cuid(),
  prefixOverride: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z0-9]{3}$/)
    .optional(),
});

export const ApplyTemplateBodySchema = ApplyTemplatePreviewBodySchema;

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
export type TemplateContent = z.infer<typeof TemplateContentSchema>;
export type TemplateContentInput = z.input<typeof TemplateContentSchema>;
export type CreateTemplateFromTableInput = z.infer<typeof CreateTemplateFromTableSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;
export type ApplyTemplateBody = z.infer<typeof ApplyTemplateBodySchema>;
