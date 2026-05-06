import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { createProjectsRouter } from './projects.routes';
import type { ProjectsService } from './projects.service';

const SECRET = 'dev-access-secret-change-in-production';
const AUTH = `Bearer ${jwtSign({ sub: 'user-1', email: 'dev@example.com' }, SECRET, {
  expiresIn: '15m',
})}`;

const PROJECT = {
  id: 'clwproject0000000000000001',
  name: 'Financeiro',
  slug: 'financeiro',
  description: null,
  visibility: 'PRIVATE',
  defaultTamFil: 2,
  defaultLang: 'pt-BR',
  ownerUserId: 'user-1',
  ownerTeamId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};
const TEAM_ID = 'clwteam000000000000000001';

function buildApp(service: Partial<ProjectsService>) {
  const app = express();
  app.use(json({ limit: '2mb' }));
  app.use('/api/v1', createProjectsRouter(service as ProjectsService));
  app.use(errorHandler);
  return app;
}

describe('projects routes', () => {
  it('requires auth for project list', async () => {
    const service = { list: vi.fn() };
    const res = await request(buildApp(service)).get('/api/v1/projects');
    expect(res.status).toBe(401);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('lists projects with parsed query params', async () => {
    const service = {
      list: vi.fn().mockResolvedValue({
        projects: [PROJECT],
        meta: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
      }),
    };

    const res = await request(buildApp(service))
      .get('/api/v1/projects?page=2&pageSize=10&search=fin&includeArchived=true')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 10,
        search: 'fin',
        includeArchived: true,
      },
      'user-1',
    );
  });

  it('parses includeArchived=false without enabling archived projects', async () => {
    const service = {
      list: vi.fn().mockResolvedValue({
        projects: [],
        meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
      }),
    };

    const res = await request(buildApp(service))
      .get('/api/v1/projects?includeArchived=false')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.list).toHaveBeenCalledWith({ includeArchived: false }, 'user-1');
  });

  it('creates a project with validated payload', async () => {
    const service = { create: vi.fn().mockResolvedValue(PROJECT) };

    const res = await request(buildApp(service))
      .post('/api/v1/projects')
      .set('Authorization', AUTH)
      .send({ name: 'Financeiro', slug: 'financeiro' });

    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({ id: PROJECT.id, slug: PROJECT.slug });
    expect(service.create).toHaveBeenCalledWith(
      {
        name: 'Financeiro',
        slug: 'financeiro',
        visibility: 'PRIVATE',
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
      'user-1',
    );
  });

  it('passes ownerTeamId when creating a team-owned project', async () => {
    const service = { create: vi.fn().mockResolvedValue({ ...PROJECT, ownerTeamId: TEAM_ID }) };

    const res = await request(buildApp(service))
      .post('/api/v1/projects')
      .set('Authorization', AUTH)
      .send({ name: 'Financeiro', slug: 'financeiro', ownerTeamId: TEAM_ID });

    expect(res.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith(
      {
        name: 'Financeiro',
        slug: 'financeiro',
        ownerTeamId: TEAM_ID,
        visibility: 'PRIVATE',
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
      'user-1',
    );
  });

  it('rejects invalid create payload', async () => {
    const service = { create: vi.fn() };

    const res = await request(buildApp(service))
      .post('/api/v1/projects')
      .set('Authorization', AUTH)
      .send({ name: 'F', slug: 'Financeiro Dev' });

    expect(res.status).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('returns one project by id', async () => {
    const service = { get: vi.fn().mockResolvedValue(PROJECT) };

    const res = await request(buildApp(service))
      .get(`/api/v1/projects/${PROJECT.id}`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.get).toHaveBeenCalledWith(PROJECT.id, 'user-1');
  });

  it('updates a project', async () => {
    const service = { update: vi.fn().mockResolvedValue({ ...PROJECT, name: 'Novo' }) };

    const res = await request(buildApp(service))
      .patch(`/api/v1/projects/${PROJECT.id}`)
      .set('Authorization', AUTH)
      .send({ name: 'Novo' });

    expect(res.status).toBe(200);
    expect(service.update).toHaveBeenCalledWith(PROJECT.id, { name: 'Novo' }, 'user-1');
  });

  it('soft-deletes a project', async () => {
    const service = { delete: vi.fn().mockResolvedValue({ ...PROJECT, deletedAt: new Date() }) };

    const res = await request(buildApp(service))
      .delete(`/api/v1/projects/${PROJECT.id}`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.delete).toHaveBeenCalledWith(PROJECT.id, 'user-1');
  });

  it('restores a project', async () => {
    const service = { restore: vi.fn().mockResolvedValue(PROJECT) };

    const res = await request(buildApp(service))
      .post(`/api/v1/projects/${PROJECT.id}/restore`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.restore).toHaveBeenCalledWith(PROJECT.id, 'user-1');
  });

  it('duplicates a project', async () => {
    const service = {
      duplicate: vi.fn().mockResolvedValue({ ...PROJECT, slug: 'financeiro-copy' }),
    };

    const res = await request(buildApp(service))
      .post(`/api/v1/projects/${PROJECT.id}/duplicate`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(201);
    expect(service.duplicate).toHaveBeenCalledWith(PROJECT.id, 'user-1');
  });
});
