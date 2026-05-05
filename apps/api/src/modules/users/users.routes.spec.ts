import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { createUsersRouter } from './users.routes';
import type { UsersService } from './users.service';

const SECRET = 'dev-access-secret-change-in-production';
const AUTH = `Bearer ${jwtSign({ sub: 'user-1', email: 'dev@example.com' }, SECRET, {
  expiresIn: '15m',
})}`;

const USER = {
  id: 'user-1',
  email: 'dev@example.com',
  name: 'Dev',
  avatarUrl: null,
  emailVerified: true,
  locale: 'pt-BR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildApp(service: Partial<UsersService>) {
  const app = express();
  app.use(json({ limit: '2mb' }));
  app.use('/api/v1', createUsersRouter(service as UsersService));
  app.use(errorHandler);
  return app;
}

describe('users routes', () => {
  it('requires auth for profile access', async () => {
    const service = { getMe: vi.fn() };
    const res = await request(buildApp(service)).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(service.getMe).not.toHaveBeenCalled();
  });

  it('returns current user', async () => {
    const service = { getMe: vi.fn().mockResolvedValue(USER) };
    const res = await request(buildApp(service)).get('/api/v1/users/me').set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: USER.id, email: USER.email, name: USER.name });
    expect(service.getMe).toHaveBeenCalledWith('user-1');
  });

  it('updates profile with validated payload', async () => {
    const service = { updateMe: vi.fn().mockResolvedValue({ ...USER, locale: 'en-US' }) };
    const res = await request(buildApp(service))
      .patch('/api/v1/users/me')
      .set('Authorization', AUTH)
      .send({ name: 'Dev Atualizado', locale: 'en-US' });
    expect(res.status).toBe(200);
    expect(service.updateMe).toHaveBeenCalledWith('user-1', {
      name: 'Dev Atualizado',
      locale: 'en-US',
    });
  });

  it('rejects invalid locale', async () => {
    const service = { updateMe: vi.fn() };
    const res = await request(buildApp(service))
      .patch('/api/v1/users/me')
      .set('Authorization', AUTH)
      .send({ locale: 'fr-FR' });
    expect(res.status).toBe(422);
    expect(service.updateMe).not.toHaveBeenCalled();
  });

  it('uploads avatar as base64 data url', async () => {
    const avatarUrl = 'data:image/png;base64,aGVsbG8=';
    const service = { updateAvatar: vi.fn().mockResolvedValue({ ...USER, avatarUrl }) };
    const res = await request(buildApp(service))
      .post('/api/v1/users/me/avatar')
      .set('Authorization', AUTH)
      .send({ avatarUrl });
    expect(res.status).toBe(200);
    expect(service.updateAvatar).toHaveBeenCalledWith('user-1', avatarUrl);
  });

  it('changes password with current password confirmation', async () => {
    const service = { changePassword: vi.fn().mockResolvedValue(undefined) };
    const body = { currentPassword: 'Senha123', newPassword: 'NovaSenha1' };
    const res = await request(buildApp(service))
      .post('/api/v1/users/me/change-password')
      .set('Authorization', AUTH)
      .send(body);
    expect(res.status).toBe(204);
    expect(service.changePassword).toHaveBeenCalledWith('user-1', body);
  });

  it('soft-deletes the current account with explicit confirmation', async () => {
    const hardDeleteScheduledAt = new Date('2026-02-01T00:00:00.000Z');
    const service = { deleteMe: vi.fn().mockResolvedValue({ hardDeleteScheduledAt }) };
    const res = await request(buildApp(service))
      .delete('/api/v1/users/me')
      .set('Authorization', AUTH)
      .send({ confirmation: 'EXCLUIR' });
    expect(res.status).toBe(200);
    expect(res.body.hardDeleteScheduledAt).toBe(hardDeleteScheduledAt.toISOString());
    expect(service.deleteMe).toHaveBeenCalledWith('user-1');
  });

  it('rejects account deletion without exact confirmation', async () => {
    const service = { deleteMe: vi.fn() };
    const res = await request(buildApp(service))
      .delete('/api/v1/users/me')
      .set('Authorization', AUTH)
      .send({ confirmation: 'excluir' });
    expect(res.status).toBe(422);
    expect(service.deleteMe).not.toHaveBeenCalled();
  });
});
