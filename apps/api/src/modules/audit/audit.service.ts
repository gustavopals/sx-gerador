import { logger } from '../../config/logger';
import type { PrismaClient } from '../../generated/prisma';

export type AuditAction =
  | 'auth.signup'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'auth.account_delete'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'projects.restore'
  | 'projects.duplicate'
  | 'tables.create'
  | 'tables.update'
  | 'tables.delete'
  | 'tables.restore';

export type AuditMetadata = Record<string, string | number | boolean | null>;

type AuditClient = Pick<PrismaClient, 'auditLog'>;

export async function logAudit(
  db: AuditClient,
  action: AuditAction,
  userId: string | null,
  metadata: AuditMetadata = {},
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        userId,
        metadata: scrubMetadata(metadata),
      },
    });
  } catch (err) {
    logger.error({ err, action, userId }, 'Failed to write audit log');
  }
}

function scrubMetadata(metadata: AuditMetadata): AuditMetadata {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (value === undefined) return false;
      return !/password|token|secret|hash/i.test(key);
    }),
  ) as AuditMetadata;
}
