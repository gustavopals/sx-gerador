import { z } from 'zod';

export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

export const UserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  role: UserRoleSchema.default('MEMBER'),
  locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  emailVerified: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número'),
  locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos de uso' }),
  }),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  locale: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
});

export const AvatarUploadSchema = z.object({
  avatarUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, 'Avatar deve ser uma imagem base64 válida')
    .max(1_400_000, 'Avatar deve ter no máximo 1MB'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número'),
});

export const DeleteAccountSchema = z.object({
  confirmation: z.literal('EXCLUIR', {
    errorMap: () => ({ message: 'Digite EXCLUIR para confirmar' }),
  }),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AvatarUploadInput = z.infer<typeof AvatarUploadSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
