import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from '@sxgerador/shared-types';
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

const RefreshSchema = z.object({ refreshToken: z.string().min(1) });
const TokenBodySchema = z.object({ token: z.string().min(1) });
const EmailBodySchema = z.object({ email: z.string().email() });

export function createAuthRouter(service: AuthService): Router {
  const router = Router();
  const ctrl = new AuthController(service);

  router.post('/auth/signup', validate(SignupSchema), ctrl.signup);
  router.post('/auth/login', validate(LoginSchema), ctrl.login);
  router.post('/auth/refresh', validate(RefreshSchema), ctrl.refresh);
  router.post('/auth/logout', validate(RefreshSchema), ctrl.logout);
  router.post('/auth/verify-email', validate(TokenBodySchema), ctrl.verifyEmail);
  router.post('/auth/resend-verification', validate(EmailBodySchema), ctrl.resendVerification);
  router.post('/auth/forgot-password', validate(ForgotPasswordSchema), ctrl.forgotPassword);
  router.post('/auth/reset-password', validate(ResetPasswordSchema), ctrl.resetPassword);

  return router;
}
