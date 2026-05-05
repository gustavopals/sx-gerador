import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma';
import { AuthError } from './auth.errors';
import { AuthService, type AuthMailer } from './auth.service';

// ---------------------------------------------------------------------------
// Prisma mock helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  user: MockedTable<{ findUnique: AnyFn; create: AnyFn; update: AnyFn; updateMany: AnyFn }>;
  refreshToken: MockedTable<{ create: AnyFn; findUnique: AnyFn; update: AnyFn; updateMany: AnyFn }>;
  emailVerificationToken: MockedTable<{ upsert: AnyFn; findFirst: AnyFn; delete: AnyFn }>;
  passwordResetToken: MockedTable<{ create: AnyFn; findUnique: AnyFn; update: AnyFn }>;
  $transaction: ReturnType<typeof vi.fn>;
}

function mockPrisma(): MockedPrisma {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER = {
  id: 'user-1',
  email: 'dev@example.com',
  name: 'Dev',
  passwordHash: '$2b$12$placeholder', // overridden per test
  emailVerified: true,
  locale: 'pt-BR',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
};

const FUTURE = new Date(Date.now() + 60 * 60 * 1000);
const PAST = new Date(Date.now() - 1000);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let db: MockedPrisma;
  let mailer: {
    sendVerificationEmail: ReturnType<typeof vi.fn>;
    sendPasswordResetEmail: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(async () => {
    db = mockPrisma();
    mailer = { sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn() };
    service = new AuthService(db as unknown as PrismaClient, mailer as AuthMailer);

    // Default: user doesn't exist (for signup tests)
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue(USER);
    db.user.update.mockResolvedValue(USER);
    db.emailVerificationToken.upsert.mockResolvedValue({} as never);
  });

  // -------------------------------------------------------------------------
  // signup
  // -------------------------------------------------------------------------

  describe('signup', () => {
    const input = { name: 'Dev', email: 'dev@example.com', password: 'Senha123' };

    it('creates user and sends verification email', async () => {
      await service.signup(input);
      expect(db.user.create).toHaveBeenCalledOnce();
      expect(db.emailVerificationToken.upsert).toHaveBeenCalledOnce();
      expect(mailer.sendVerificationEmail).toHaveBeenCalledOnce();
      const [to, name] = mailer.sendVerificationEmail.mock.calls[0]!;
      expect(to).toBe(input.email);
      expect(name).toBe(input.name);
    });

    it('throws 409 when email is already in use', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      await expect(service.signup(input)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('returns token pair for valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('Senha123', 1);
      db.user.findUnique.mockResolvedValue({ ...USER, passwordHash: hash });
      db.refreshToken.create.mockResolvedValue({} as never);

      const result = await service.login({ email: USER.email, password: 'Senha123' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws 401 when user not found', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 when password is wrong', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('correct', 1);
      db.user.findUnique.mockResolvedValue({ ...USER, passwordHash: hash });
      await expect(service.login({ email: USER.email, password: 'wrong' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 403 when email not verified', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('Senha123', 1);
      db.user.findUnique.mockResolvedValue({ ...USER, passwordHash: hash, emailVerified: false });
      await expect(
        service.login({ email: USER.email, password: 'Senha123' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  describe('refresh', () => {
    it('throws 401 for unknown token hash', async () => {
      db.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('unknown-raw-token')).rejects.toBeInstanceOf(AuthError);
    });

    it('throws 401 for revoked token', async () => {
      db.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: USER.id,
        tokenHash: 'h',
        expiresAt: FUTURE,
        revokedAt: new Date(),
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
      });
      await expect(service.refresh('some-token')).rejects.toBeInstanceOf(AuthError);
    });

    it('throws 401 for expired token', async () => {
      db.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: USER.id,
        tokenHash: 'h',
        expiresAt: PAST,
        revokedAt: null,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
      });
      await expect(service.refresh('some-token')).rejects.toBeInstanceOf(AuthError);
    });
  });

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      db.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('some-raw-token');
      expect(db.refreshToken.updateMany).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // verifyEmail
  // -------------------------------------------------------------------------

  describe('verifyEmail', () => {
    it('marks user as verified and deletes token', async () => {
      const record = {
        id: 'evt-1',
        userId: USER.id,
        tokenHash: 'h',
        expiresAt: FUTURE,
        createdAt: new Date(),
      };
      db.emailVerificationToken.findFirst.mockResolvedValue(record);
      db.emailVerificationToken.delete.mockResolvedValue(record);

      await service.verifyEmail('valid-raw-token');
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { emailVerified: true } }),
      );
      expect(db.emailVerificationToken.delete).toHaveBeenCalledOnce();
    });

    it('throws 401 for unknown token', async () => {
      db.emailVerificationToken.findFirst.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 for expired token', async () => {
      db.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'evt-1',
        userId: USER.id,
        tokenHash: 'h',
        expiresAt: PAST,
        createdAt: new Date(),
      });
      await expect(service.verifyEmail('expired-token')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  // -------------------------------------------------------------------------
  // forgotPassword
  // -------------------------------------------------------------------------

  describe('forgotPassword', () => {
    it('sends reset email when user exists', async () => {
      db.user.findUnique.mockResolvedValue(USER);
      db.passwordResetToken.create.mockResolvedValue({} as never);

      await service.forgotPassword(USER.email);
      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledOnce();
    });

    it('returns silently when email does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(service.forgotPassword('unknown@example.com')).resolves.toBeUndefined();
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // resetPassword
  // -------------------------------------------------------------------------

  describe('resetPassword', () => {
    const record = {
      id: 'prt-1',
      userId: USER.id,
      tokenHash: 'h',
      expiresAt: FUTURE,
      usedAt: null,
      createdAt: new Date(),
    };

    it('updates password and revokes all refresh tokens', async () => {
      db.passwordResetToken.findUnique.mockResolvedValue(record);
      db.passwordResetToken.update.mockResolvedValue({ ...record, usedAt: new Date() });
      db.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.resetPassword('valid-token', 'NewPass1');
      expect(db.$transaction).toHaveBeenCalledOnce();
    });

    it('throws 401 for unknown token', async () => {
      db.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad', 'NewPass1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 for already-used token', async () => {
      db.passwordResetToken.findUnique.mockResolvedValue({ ...record, usedAt: new Date() });
      await expect(service.resetPassword('used', 'NewPass1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 for expired token', async () => {
      db.passwordResetToken.findUnique.mockResolvedValue({ ...record, expiresAt: PAST });
      await expect(service.resetPassword('expired', 'NewPass1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  // -------------------------------------------------------------------------
  // resendVerificationEmail
  // -------------------------------------------------------------------------

  describe('resendVerificationEmail', () => {
    it('sends a new verification email for unverified user', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER, emailVerified: false });
      db.emailVerificationToken.upsert.mockResolvedValue({} as never);

      await service.resendVerificationEmail(USER.email);

      expect(db.emailVerificationToken.upsert).toHaveBeenCalledOnce();
      expect(mailer.sendVerificationEmail).toHaveBeenCalledOnce();
      const [to, name] = mailer.sendVerificationEmail.mock.calls[0]!;
      expect(to).toBe(USER.email);
      expect(name).toBe(USER.name);
    });

    it('returns silently when user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(service.resendVerificationEmail('unknown@example.com')).resolves.toBeUndefined();
      expect(mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('returns silently when email is already verified', async () => {
      db.user.findUnique.mockResolvedValue({ ...USER, emailVerified: true });
      await expect(service.resendVerificationEmail(USER.email)).resolves.toBeUndefined();
      expect(mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
