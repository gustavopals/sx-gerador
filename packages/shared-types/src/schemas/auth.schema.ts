import { z } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from './user.schema';

export const SignupSchema = CreateUserSchema;

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

const passwordRules = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número');

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: passwordRules,
});

export const UpdateProfileSchema = UpdateUserSchema;

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
