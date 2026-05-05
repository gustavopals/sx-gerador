import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { createEmailService } from '../email';
import { createUsersRouter } from './users.routes';
import { UsersService } from './users.service';

const emailService = createEmailService({
  from: env.emailFrom,
  appUrl: env.appUrl,
  smtpHost: env.smtpHost,
  smtpPort: env.smtpPort,
  smtpUser: env.smtpUser,
  smtpPassword: env.smtpPassword,
  smtpSecure: env.smtpSecure,
});

export const usersService = new UsersService(prisma, emailService);
export const usersRouter = createUsersRouter(usersService);
