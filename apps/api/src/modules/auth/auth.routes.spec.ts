import express, { json } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { AuthError } from './auth.errors';
import { createAuthRouter } from './auth.routes';
import type { AuthService } from './auth.service';

// ---------------------------------------------------------------------------
// App factory with mocked service
// ---------------------------------------------------------------------------

function buildApp(service: Partial<AuthService>) {
  const app = express();
  app.use(json());
  app.use('/api/v1', createAuthRouter(service as AuthService));
  app.use(errorHandler);
  return app;
}

const TOKEN_PAIR = { accessToken: 'access-jwt', refreshToken: 'raw-refresh' };

describe('POST /api/v1/auth/signup', () => {
  const validBody = {
    name: 'Dev',
    email: 'dev@example.com',
    password: 'Senha123',
    acceptedTerms: true,
  };

  it('returns 201 on success', async () => {
    const service = { signup: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service)).post('/api/v1/auth/signup').send(validBody);
    expect(res.status).toBe(201);
    expect(service.signup).toHaveBeenCalledOnce();
  });

  it('returns 422 for missing fields', async () => {
    const service = { signup: vi.fn() };
    const res = await request(buildApp(service)).post('/api/v1/auth/signup').send({ email: 'x' });
    expect(res.status).toBe(422);
    expect(service.signup).not.toHaveBeenCalled();
  });

  it('returns 409 when email already in use', async () => {
    const service = {
      signup: vi.fn().mockRejectedValue(new AuthError('E-mail já cadastrado', 409)),
    };
    const res = await request(buildApp(service)).post('/api/v1/auth/signup').send(validBody);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  const validBody = { email: 'dev@example.com', password: 'Senha123' };

  it('returns 200 with token pair on success', async () => {
    const service = { login: vi.fn().mockResolvedValue(TOKEN_PAIR) };
    const res = await request(buildApp(service)).post('/api/v1/auth/login').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(TOKEN_PAIR);
  });

  it('returns 422 for invalid email', async () => {
    const service = { login: vi.fn() };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/login')
      .send({ email: 'bad', password: 'x' });
    expect(res.status).toBe(422);
  });

  it('returns 401 for wrong credentials', async () => {
    const service = {
      login: vi.fn().mockRejectedValue(new AuthError('E-mail ou senha inválidos', 401)),
    };
    const res = await request(buildApp(service)).post('/api/v1/auth/login').send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 403 when email not verified', async () => {
    const service = {
      login: vi.fn().mockRejectedValue(new AuthError('E-mail não verificado', 403)),
    };
    const res = await request(buildApp(service)).post('/api/v1/auth/login').send(validBody);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns 200 with new token pair', async () => {
    const service = { refresh: vi.fn().mockResolvedValue(TOKEN_PAIR) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'raw' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(TOKEN_PAIR);
  });

  it('returns 422 when refreshToken is missing', async () => {
    const service = { refresh: vi.fn() };
    const res = await request(buildApp(service)).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(422);
  });

  it('returns 401 for invalid token', async () => {
    const service = {
      refresh: vi.fn().mockRejectedValue(new AuthError('Token inválido ou expirado', 401)),
    };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'bad' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 204 on success', async () => {
    const service = { logout: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'raw' });
    expect(res.status).toBe(204);
  });

  it('returns 422 when refreshToken is missing', async () => {
    const service = { logout: vi.fn() };
    const res = await request(buildApp(service)).post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/verify-email', () => {
  it('returns 200 on success', async () => {
    const service = { verifyEmail: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/verify-email')
      .send({ token: 'abc' });
    expect(res.status).toBe(200);
  });

  it('returns 401 for invalid token', async () => {
    const service = {
      verifyEmail: vi.fn().mockRejectedValue(new AuthError('Token inválido ou expirado', 401)),
    };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/verify-email')
      .send({ token: 'bad' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/forgot-password', () => {
  it('returns 200 even for unknown email (silent)', async () => {
    const service = { forgotPassword: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'x@x.com' });
    expect(res.status).toBe(200);
  });

  it('returns 422 for invalid email', async () => {
    const service = { forgotPassword: vi.fn() };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-email' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  const validBody = { token: 'reset-tok', password: 'NewPass1' };

  it('returns 200 on success', async () => {
    const service = { resetPassword: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/reset-password')
      .send(validBody);
    expect(res.status).toBe(200);
  });

  it('returns 422 for weak password', async () => {
    const service = { resetPassword: vi.fn() };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/reset-password')
      .send({ token: 'tok', password: 'weak' });
    expect(res.status).toBe(422);
  });

  it('returns 401 for used/expired token', async () => {
    const service = {
      resetPassword: vi.fn().mockRejectedValue(new AuthError('Token inválido ou expirado', 401)),
    };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/reset-password')
      .send(validBody);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /auth/resend-verification
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/resend-verification', () => {
  it('returns 200 for a valid email', async () => {
    const service = { resendVerificationEmail: vi.fn().mockResolvedValue(undefined) };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'dev@example.com' });
    expect(res.status).toBe(200);
  });

  it('returns 422 for invalid email format', async () => {
    const service = { resendVerificationEmail: vi.fn() };
    const res = await request(buildApp(service))
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });
});
