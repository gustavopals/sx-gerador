import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { createEmailService } from '../email';
import { createAuthRouter } from './auth.routes';
import { AuthService } from './auth.service';

const emailService = createEmailService({
  from: env.emailFrom,
  appUrl: env.appUrl,
  smtpHost: env.smtpHost,
  smtpPort: env.smtpPort,
  smtpUser: env.smtpUser,
  smtpPassword: env.smtpPassword,
  smtpSecure: env.smtpSecure,
});

export const authService = new AuthService(prisma, emailService);
export const authRouter = createAuthRouter(authService);
