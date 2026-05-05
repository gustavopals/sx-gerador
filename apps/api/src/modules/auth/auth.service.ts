import crypto from 'crypto';
import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt';
import { sign as jwtSign, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { PrismaClient } from '../../generated/prisma';
import { AuthError, Errors } from './auth.errors';

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 2 * 60 * 60 * 1000; // 2h

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserPayload {
  sub: string;
  email: string;
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function signAccessToken(payload: AuthUserPayload): string {
  return jwtSign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  });
}

function parseRefreshExpiry(): Date {
  // Parse "30d", "7d", "1h" etc. into an absolute Date
  const raw = env.jwtRefreshExpiresIn;
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN: ${raw}`);
  const amount = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const ms: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + amount * ms[unit]!);
}

/** Typed mailer interface — implemented by EmailService (F1.6). */
export interface AuthMailer {
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
}

const noopMailer: AuthMailer = {
  sendVerificationEmail: async () => undefined,
  sendPasswordResetEmail: async () => undefined,
};

export class AuthService {
  constructor(
    private readonly db: PrismaClient,
    private readonly mailer: AuthMailer = noopMailer,
  ) {}

  async signup(input: {
    name: string;
    email: string;
    password: string;
    locale?: string;
  }): Promise<void> {
    const existing = await this.db.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AuthError(Errors.EMAIL_IN_USE.message, Errors.EMAIL_IN_USE.statusCode);

    const passwordHash = await bcryptHash(input.password, BCRYPT_ROUNDS);
    const user = await this.db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        locale: input.locale ?? 'pt-BR',
      },
    });

    const rawToken = generateOpaqueToken();
    await this.db.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
      create: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    await this.mailer.sendVerificationEmail(input.email, input.name, rawToken);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.db.user.findUnique({ where: { email } });
    // Silent return — never reveal whether the email exists
    if (!user || user.emailVerified) return;

    const rawToken = generateOpaqueToken();
    await this.db.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
      create: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    await this.mailer.sendVerificationEmail(email, user.name, rawToken);
  }

  async login(
    input: { email: string; password: string },
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    if (!user)
      throw new AuthError(
        Errors.INVALID_CREDENTIALS.message,
        Errors.INVALID_CREDENTIALS.statusCode,
      );

    const passwordMatch = await bcryptCompare(input.password, user.passwordHash);
    if (!passwordMatch)
      throw new AuthError(
        Errors.INVALID_CREDENTIALS.message,
        Errors.INVALID_CREDENTIALS.statusCode,
      );

    if (!user.emailVerified)
      throw new AuthError(Errors.EMAIL_NOT_VERIFIED.message, Errors.EMAIL_NOT_VERIFIED.statusCode);

    await this.db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.issueTokenPair({ sub: user.id, email: user.email }, meta);
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);

    const stored = await this.db.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AuthError(Errors.INVALID_TOKEN.message, Errors.INVALID_TOKEN.statusCode);
    }

    const user = await this.db.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new AuthError(Errors.INVALID_TOKEN.message, Errors.INVALID_TOKEN.statusCode);

    await this.db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair({ sub: user.id, email: user.email }, {});
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.db.emailVerificationToken.findFirst({ where: { tokenHash } });
    if (!record || record.expiresAt < new Date()) {
      throw new AuthError(Errors.INVALID_TOKEN.message, Errors.INVALID_TOKEN.statusCode);
    }

    await this.db.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await this.db.emailVerificationToken.delete({ where: { id: record.id } });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.db.user.findUnique({ where: { email } });
    // Silent return — never reveal whether the email exists
    if (!user) return;

    const rawToken = generateOpaqueToken();
    await this.db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    await this.mailer.sendPasswordResetEmail(email, user.name, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const record = await this.db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AuthError(Errors.INVALID_TOKEN.message, Errors.INVALID_TOKEN.statusCode);
    }

    const passwordHash = await bcryptHash(newPassword, BCRYPT_ROUNDS);

    await this.db.$transaction([
      this.db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.db.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async issueTokenPair(
    payload: AuthUserPayload,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const accessToken = signAccessToken(payload);
    const rawRefresh = generateOpaqueToken();

    await this.db.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: hashToken(rawRefresh),
        expiresAt: parseRefreshExpiry(),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }
}
