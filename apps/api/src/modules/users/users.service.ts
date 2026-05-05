import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt';
import { logger } from '../../config/logger';
import type { PrismaClient, User } from '../../generated/prisma';
import { logAudit } from '../audit';
import { AuthError } from '../auth/auth.errors';
import type { EmailService } from '../email';

const BCRYPT_ROUNDS = 12;
const HARD_DELETE_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'name' | 'avatarUrl' | 'emailVerified' | 'locale' | 'createdAt' | 'updatedAt'
>;

export class UsersService {
  constructor(
    private readonly db: PrismaClient,
    private readonly mailer?: Pick<EmailService, 'sendAccountDeletionEmail'>,
  ) {}

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.findActiveUser(userId);
    if (!user) throw new AuthError('Usuário não encontrado', 404);
    return toPublicUser(user);
  }

  async updateMe(userId: string, input: { name?: string; locale?: string }): Promise<PublicUser> {
    const activeUser = await this.findActiveUser(userId);
    if (!activeUser) throw new AuthError('Usuário não encontrado', 404);

    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.locale ? { locale: input.locale } : {}),
      },
    });
    return toPublicUser(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
    const activeUser = await this.findActiveUser(userId);
    if (!activeUser) throw new AuthError('Usuário não encontrado', 404);

    const user = await this.db.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return toPublicUser(user);
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const user = await this.findActiveUser(userId);
    if (!user) throw new AuthError('Usuário não encontrado', 404);

    const passwordMatch = await bcryptCompare(input.currentPassword, user.passwordHash);
    if (!passwordMatch) throw new AuthError('Senha atual inválida', 401);

    const passwordHash = await bcryptHash(input.newPassword, BCRYPT_ROUNDS);
    await this.db.$transaction([
      this.db.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.db.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async deleteMe(userId: string): Promise<{ hardDeleteScheduledAt: Date }> {
    const user = await this.findActiveUser(userId);
    if (!user) throw new AuthError('Usuário não encontrado', 404);

    const deletedAt = new Date();
    const hardDeleteScheduledAt = new Date(deletedAt.getTime() + HARD_DELETE_DELAY_MS);

    await this.db.$transaction([
      this.db.user.update({
        where: { id: userId },
        data: {
          deletedAt,
          hardDeleteScheduledAt,
          avatarUrl: null,
        },
      }),
      this.db.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: deletedAt },
      }),
    ]);

    try {
      await this.mailer?.sendAccountDeletionEmail(user.email, user.name, hardDeleteScheduledAt);
    } catch (err) {
      logger.error({ err, userId }, 'Failed to send account deletion confirmation email');
    }

    await logAudit(this.db, 'auth.account_delete', userId, {
      hardDeleteScheduledAt: hardDeleteScheduledAt.toISOString(),
    });

    return { hardDeleteScheduledAt };
  }

  private async findActiveUser(userId: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
  }
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    locale: user.locale,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
