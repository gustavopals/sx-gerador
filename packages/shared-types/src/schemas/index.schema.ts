import { z } from 'zod';
import { OwnerTypeSchema } from './field.schema';
import { YesNoSchema } from './table.schema';

const IndexOrderSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, 'Ordem deve ser um número inteiro positivo (ex: 1, 2, 3)');

const IndexKeySchema = z.string().trim().min(1).max(160);
const IndexDescriptionSchema = z.string().trim().min(1).max(70);

const IndexSchemaBase = z.object({
  order: IndexOrderSchema,
  key: IndexKeySchema,
  descPt: IndexDescriptionSchema,
  descEs: IndexDescriptionSchema.optional().nullable(),
  descEn: IndexDescriptionSchema.optional().nullable(),
  owner: OwnerTypeSchema.default('U'),
  searchExpr: z.string().trim().max(160).optional().nullable(),
  nickname: z.string().trim().max(10).optional().nullable(),
  showSearch: YesNoSchema.default('S'),
  isVirtual: YesNoSchema.default('N'),
  virtualCustomizable: YesNoSchema.default('N'),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const CreateIndexSchema = IndexSchemaBase;

export const UpdateIndexSchema = IndexSchemaBase.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'Informe ao menos um campo para atualizar',
  },
);

export type CreateIndexInput = z.input<typeof CreateIndexSchema>;
export type CreateIndexData = z.output<typeof CreateIndexSchema>;
export type UpdateIndexInput = z.input<typeof UpdateIndexSchema>;
