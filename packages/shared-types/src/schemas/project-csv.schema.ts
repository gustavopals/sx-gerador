import { z } from 'zod';

const CsvContentSchema = z.string().max(5_000_000);

export const ImportCsvBodySchema = z
  .object({
    sx2: CsvContentSchema.optional(),
    sx3: CsvContentSchema.optional(),
    six: CsvContentSchema.optional(),
    options: z
      .object({
        syncDeletions: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((v) => Boolean(v.sx2?.trim() || v.sx3?.trim() || v.six?.trim()), {
    message: 'Informe ao menos um arquivo CSV (sx2, sx3 ou six).',
  });

export const ImportCsvPreviewBodySchema = ImportCsvBodySchema;

export const ExportCsvParamSchema = z.enum(['sx2', 'sx3', 'six']);

export type ImportCsvBody = z.infer<typeof ImportCsvBodySchema>;
export type ImportCsvPreviewBody = z.infer<typeof ImportCsvPreviewBodySchema>;
