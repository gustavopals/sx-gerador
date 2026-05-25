import { z } from 'zod';
import { YesNoSchema } from './table.schema';

export const FieldTypeSchema = z.enum(['C', 'N', 'D', 'M', 'L']);
export const VisualModeSchema = z.enum(['V', 'A', 'R']);
export const ContextModeSchema = z.enum(['R', 'V']);
export const OwnerTypeSchema = z.enum(['U', 'S']);

const FieldNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9]{3}_[A-Z0-9_]+$/, 'Nome deve seguir o padrão PREFIXO_NOME')
  .max(10, 'Máximo de 10 caracteres');

export const FieldOrderSchema = z
  .string()
  .trim()
  .regex(/^\d{2}$/, 'Ordem deve conter 2 dígitos (ex: 01)');

const TitleSchema = z.string().trim().min(1).max(12);
const DescriptionSchema = z.string().trim().min(1).max(25);
const OptionalShortTextSchema = z.string().trim().max(50).optional().nullable();
const OptionalExpression100Schema = z.string().trim().max(100).optional().nullable();
const OptionalExpression160Schema = z.string().trim().max(160).optional().nullable();
const OptionalSqlSchema = z.string().trim().max(250).optional().nullable();
const OptionalLongTextSchema = z.string().trim().max(2000).optional().nullable();

const OptionalComboSchema = z.string().trim().max(128).optional().nullable();
const JsonFlagValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const JsonFlagsSchema = z.record(z.string(), JsonFlagValueSchema).default({});

const FieldSchemaBase = z.object({
  name: FieldNameSchema,
  order: FieldOrderSchema.optional(),
  type: FieldTypeSchema,
  size: z.number().int().min(1).max(254),
  decimals: z.number().int().min(0).max(20).default(0),

  titlePt: TitleSchema,
  titleEs: TitleSchema.optional().nullable(),
  titleEn: TitleSchema.optional().nullable(),

  descPt: DescriptionSchema,
  descEs: DescriptionSchema.optional().nullable(),
  descEn: DescriptionSchema.optional().nullable(),

  picture: z.string().trim().max(45).optional().nullable(),
  pictureVar: OptionalShortTextSchema,
  pictureBrowse: OptionalShortTextSchema,
  validation: OptionalExpression160Schema,
  userValidation: OptionalExpression160Schema,
  defaultRel: OptionalExpression160Schema,
  whenExpr: OptionalExpression100Schema,
  initBrowse: OptionalExpression100Schema,

  comboPt: OptionalComboSchema,
  comboEs: OptionalComboSchema,
  comboEn: OptionalComboSchema,

  searchKey: z.string().trim().max(6).optional().nullable(),

  visualMode: VisualModeSchema.default('A'),
  contextMode: ContextModeSchema.default('R'),
  owner: OwnerTypeSchema.default('U'),
  required: z.string().trim().max(8).optional().nullable(),
  showBrowse: YesNoSchema.default('S'),
  hasCheck: YesNoSchema.default('N'),
  hasTrigger: YesNoSchema.default('N'),
  level: z.number().int().min(0).max(9).default(0),
  pyme: YesNoSchema.default('N'),
  serverIndex: YesNoSchema.default('N'),
  fieldIndex: YesNoSchema.default('N'),
  spelling: YesNoSchema.default('N'),
  modal: YesNoSchema.default('N'),
  positionLogix: YesNoSchema.default('N'),

  usadoFlags: JsonFlagsSchema,
  modulesFlags: JsonFlagsSchema,

  sqlCondition: OptionalSqlSchema,
  sqlCheck: OptionalSqlSchema,

  groupSxg: z.string().trim().max(3).optional().nullable(),
  folder: z.string().trim().max(1).optional().nullable(),
  screen: z.string().trim().max(15).optional().nullable(),
  grouping: z.string().trim().max(3).optional().nullable(),
  reserved: z.string().trim().max(16).optional().nullable(),
  notes: OptionalLongTextSchema,
});

export const CreateFieldSchema = FieldSchemaBase.refine(
  (data) => data.type === 'N' || data.decimals === 0,
  {
    message: 'Decimais só pode ser > 0 quando tipo é numérico',
    path: ['decimals'],
  },
)
  .refine((data) => data.type !== 'N' || data.size > data.decimals, {
    message: 'Para tipo N, tamanho deve ser maior que decimais',
    path: ['size'],
  })
  .refine(
    (data) => {
      const hasAnyCombo = Boolean(data.comboPt || data.comboEs || data.comboEn);
      if (!hasAnyCombo) return true;
      return data.type === 'C' || data.type === 'N';
    },
    {
      message: 'Combobox só é permitido para campos dos tipos C ou N',
      path: ['comboPt'],
    },
  );

export const UpdateFieldSchema = FieldSchemaBase.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  })
  .refine(
    (data) =>
      data.type === undefined ||
      data.type === 'N' ||
      data.decimals === undefined ||
      data.decimals === 0,
    {
      message: 'Decimais só pode ser > 0 quando tipo é numérico',
      path: ['decimals'],
    },
  )
  .refine(
    (data) =>
      data.type === undefined ||
      data.type !== 'N' ||
      data.size === undefined ||
      data.decimals === undefined ||
      data.size > data.decimals,
    {
      message: 'Para tipo N, tamanho deve ser maior que decimais',
      path: ['size'],
    },
  )
  .refine(
    (data) => {
      const hasAnyCombo = Boolean(data.comboPt || data.comboEs || data.comboEn);
      if (!hasAnyCombo) return true;
      if (data.type === undefined) return true;
      return data.type === 'C' || data.type === 'N';
    },
    {
      message: 'Combobox só é permitido para campos dos tipos C ou N',
      path: ['comboPt'],
    },
  );

export type FieldType = z.infer<typeof FieldTypeSchema>;
export type CreateFieldInput = z.input<typeof CreateFieldSchema>;
export type CreateFieldData = z.output<typeof CreateFieldSchema>;
export type UpdateFieldInput = z.input<typeof UpdateFieldSchema>;
