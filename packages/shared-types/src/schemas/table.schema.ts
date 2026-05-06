import { z } from 'zod';

export const SharingModeSchema = z.enum(['C', 'E']);
export const YesNoSchema = z.enum(['S', 'N']);

const PrefixSchema = z
  .string()
  .trim()
  .length(3, 'Prefixo deve ter exatamente 3 caracteres')
  .regex(/^[A-Z0-9]{3}$/, 'Prefixo deve conter apenas letras A-Z e dígitos 0-9 em maiúsculas');

const FileNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9]{3}010$/, 'Nome do arquivo deve ter o formato <PREFIX>010');

const NameSchema = z.string().trim().min(1).max(30);
const RoutineSchema = z.string().trim().max(40).optional().nullable();
const UniqueKeySchema = z.string().trim().max(250).optional().nullable();
const NotesSchema = z.string().trim().max(2000).optional().nullable();
const TamSchema = z.number().int().min(1).max(10);
const ModulesSchema = z.number().int().min(0);

export const CreateTableSchema = z
  .object({
    prefix: PrefixSchema,
    fileName: FileNameSchema.optional(),
    namePt: NameSchema,
    nameEs: NameSchema.optional().nullable(),
    nameEn: NameSchema.optional().nullable(),
    routine: RoutineSchema,
    modeCompany: SharingModeSchema.default('C'),
    modeUnit: SharingModeSchema.default('C'),
    modeBranch: SharingModeSchema.default('C'),
    ttsEnabled: YesNoSchema.default('S'),
    uniqueKey: UniqueKeySchema,
    pyme: YesNoSchema.default('N'),
    modules: ModulesSchema.default(0),
    hasClob: YesNoSchema.default('N'),
    autoIncRec: YesNoSchema.default('N'),
    tamFil: TamSchema.default(2),
    tamUn: TamSchema.default(2),
    tamEmp: TamSchema.default(2),
    notes: NotesSchema,
  })
  .refine((data) => data.fileName === undefined || data.fileName === `${data.prefix}010`, {
    path: ['fileName'],
    message: 'Nome do arquivo deve corresponder ao prefixo informado',
  })
  .transform((data) => ({
    ...data,
    fileName: data.fileName ?? `${data.prefix}010`,
  }));

export const UpdateTableSchema = z
  .object({
    namePt: NameSchema.optional(),
    nameEs: NameSchema.optional().nullable(),
    nameEn: NameSchema.optional().nullable(),
    routine: RoutineSchema,
    modeCompany: SharingModeSchema.optional(),
    modeUnit: SharingModeSchema.optional(),
    modeBranch: SharingModeSchema.optional(),
    ttsEnabled: YesNoSchema.optional(),
    uniqueKey: UniqueKeySchema,
    pyme: YesNoSchema.optional(),
    modules: ModulesSchema.optional(),
    hasClob: YesNoSchema.optional(),
    autoIncRec: YesNoSchema.optional(),
    tamFil: TamSchema.optional(),
    tamUn: TamSchema.optional(),
    tamEmp: TamSchema.optional(),
    notes: NotesSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type SharingMode = z.infer<typeof SharingModeSchema>;
export type YesNo = z.infer<typeof YesNoSchema>;
export type CreateTableInput = z.input<typeof CreateTableSchema>;
export type CreateTableData = z.output<typeof CreateTableSchema>;
export type UpdateTableInput = z.input<typeof UpdateTableSchema>;
