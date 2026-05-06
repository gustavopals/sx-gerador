import { z } from 'zod';

export const ProjectVisibilitySchema = z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']);

const ProjectNameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100);
const ProjectSlugSchema = z
  .string()
  .trim()
  .min(2, 'Slug deve ter pelo menos 2 caracteres')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter letras minúsculas, números e hífens');
const ProjectDescriptionSchema = z.string().trim().max(500).optional().nullable();

export const ProjectSchema = z.object({
  id: z.string().cuid(),
  name: ProjectNameSchema,
  slug: ProjectSlugSchema,
  description: ProjectDescriptionSchema,
  visibility: ProjectVisibilitySchema.default('PRIVATE'),
  ownerUserId: z.string().cuid().nullable().optional(),
  ownerTeamId: z.string().cuid().nullable().optional(),
  defaultTamFil: z.number().int().min(1).max(6).default(2),
  defaultLang: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateProjectSchema = z.object({
  name: ProjectNameSchema,
  slug: ProjectSlugSchema,
  description: ProjectDescriptionSchema,
  visibility: ProjectVisibilitySchema.default('PRIVATE'),
  ownerTeamId: z.string().cuid().nullable().optional(),
  defaultTamFil: z.number().int().min(1).max(6).default(2),
  defaultLang: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
});

export const UpdateProjectSchema = z
  .object({
    name: ProjectNameSchema.optional(),
    slug: ProjectSlugSchema.optional(),
    description: ProjectDescriptionSchema,
    visibility: ProjectVisibilitySchema.optional(),
    defaultTamFil: z.number().int().min(1).max(6).optional(),
    defaultLang: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type ProjectVisibility = z.infer<typeof ProjectVisibilitySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.input<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>;
