import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { optionalAuth, requireAuth } from './auth.middleware';

const SECRET = 'dev-access-secret-change-in-production';

function validToken(payload = { sub: 'user-1', email: 'dev@example.com' }): string {
  return jwtSign(payload, SECRET, { expiresIn: '15m' });
}

function buildApp() {
  const app = express();
  app.use(json());

  app.get('/protected', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.get('/optional', optionalAuth, (req, res) => {
    res.json({ user: req.user ?? null });
  });

  return app;
}

describe('requireAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(buildApp()).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(401);
  });

  it('returns 401 when signed with wrong secret', async () => {
    const token = jwtSign({ sub: 'u1', email: 'x@x.com' }, 'wrong-secret');
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for expired token', async () => {
    const token = jwtSign({ sub: 'u1', email: 'x@x.com' }, SECRET, { expiresIn: -1 });
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('passes and attaches req.user for valid token', async () => {
    const token = validToken();
    const res = await request(buildApp()).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ sub: 'user-1', email: 'dev@example.com' });
  });
});

describe('optionalAuth', () => {
  it('proceeds without user when no header', async () => {
    const res = await request(buildApp()).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('attaches user when valid token provided', async () => {
    const token = validToken();
    const res = await request(buildApp()).get('/optional').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ sub: 'user-1' });
  });

  it('proceeds without user when token is invalid (no 401)', async () => {
    const res = await request(buildApp()).get('/optional').set('Authorization', 'Bearer bad.tok');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
