import { z } from 'zod';

export const TeamRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export const ProjectInviteStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'REVOKED',
]);

const TeamNameSchema = z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100);
const TeamSlugSchema = z
  .string()
  .trim()
  .min(2, 'Slug deve ter pelo menos 2 caracteres')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter letras minúsculas, números e hífens');
const TeamDescriptionSchema = z.string().trim().max(500).optional().nullable();
const AvatarUrlSchema = z.string().trim().url().max(500).optional().nullable();

export const TeamSchema = z.object({
  id: z.string().cuid(),
  name: TeamNameSchema,
  slug: TeamSlugSchema,
  description: TeamDescriptionSchema,
  avatarUrl: AvatarUrlSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const TeamMemberSchema = z.object({
  id: z.string().cuid(),
  teamId: z.string().cuid(),
  userId: z.string().cuid(),
  role: TeamRoleSchema.default('MEMBER'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  removedAt: z.coerce.date().nullable().optional(),
});

export const ProjectInviteSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  email: z.string().trim().email().toLowerCase(),
  invitedById: z.string().cuid(),
  role: TeamRoleSchema.default('MEMBER'),
  status: ProjectInviteStatusSchema.default('PENDING'),
  expiresAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable().optional(),
  rejectedAt: z.coerce.date().nullable().optional(),
  revokedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateTeamSchema = z.object({
  name: TeamNameSchema,
  slug: TeamSlugSchema,
  description: TeamDescriptionSchema,
  avatarUrl: AvatarUrlSchema,
});

export const UpdateTeamSchema = z
  .object({
    name: TeamNameSchema.optional(),
    slug: TeamSlugSchema.optional(),
    description: TeamDescriptionSchema,
    avatarUrl: AvatarUrlSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const InviteProjectMemberSchema = z.object({
  projectId: z.string().cuid(),
  email: z.string().trim().email().toLowerCase(),
  role: TeamRoleSchema.default('MEMBER'),
});

export const UpdateTeamMemberRoleSchema = z.object({
  role: TeamRoleSchema,
});

export const TransferTeamOwnershipSchema = z.object({
  userId: z.string().cuid(),
});

export const InviteTokenSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type ProjectInviteStatus = z.infer<typeof ProjectInviteStatusSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type ProjectInvite = z.infer<typeof ProjectInviteSchema>;
export type CreateTeamInput = z.input<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.input<typeof UpdateTeamSchema>;
export type InviteProjectMemberInput = z.input<typeof InviteProjectMemberSchema>;
export type UpdateTeamMemberRoleInput = z.input<typeof UpdateTeamMemberRoleSchema>;
export type TransferTeamOwnershipInput = z.input<typeof TransferTeamOwnershipSchema>;
export type InviteTokenInput = z.input<typeof InviteTokenSchema>;
