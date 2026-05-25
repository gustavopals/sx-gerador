import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import type { ProjectCsvService } from './project-csv.service';
import type { ProjectImportService } from './project-import.service';
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

function buildApp(
  service: Partial<ProjectsService>,
  importSvc: Partial<ProjectImportService> = {},
  csvSvc: Partial<ProjectCsvService> = {},
) {
  const app = express();
  app.use(json({ limit: '2mb' }));
  app.use(
    '/api/v1',
    createProjectsRouter(
      service as ProjectsService,
      importSvc as ProjectImportService,
      csvSvc as ProjectCsvService,
    ),
  );
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

  it('exports project JSON as attachment', async () => {
    const exportDoc = {
      format: 'sxgerador-project' as const,
      formatVersion: 1 as const,
      exportedAt: '2026-05-12T12:00:00.000Z',
      project: PROJECT,
      tables: [],
    };
    const service = { exportJson: vi.fn().mockResolvedValue(exportDoc) };

    const res = await request(buildApp(service))
      .get(`/api/v1/projects/${PROJECT.id}/export`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(service.exportJson).toHaveBeenCalledWith(PROJECT.id, 'user-1');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('.json');
    expect(res.text).toContain('"format": "sxgerador-project"');
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

  it('previews import JSON', async () => {
    const preview = vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      summary: {
        tablesCreated: 0,
        tablesUpdated: 0,
        tablesDeleted: 0,
        fieldsCreated: 0,
        fieldsUpdated: 0,
        fieldsDeleted: 0,
        indexesCreated: 0,
        indexesUpdated: 0,
        indexesDeleted: 0,
      },
      tables: [],
    });

    const res = await request(buildApp({}, { preview }))
      .post(`/api/v1/projects/${PROJECT.id}/import/preview`)
      .set('Authorization', AUTH)
      .send({ document: { format: 'sxgerador-project' } });

    expect(res.status).toBe(200);
    expect(preview).toHaveBeenCalledWith(PROJECT.id, { format: 'sxgerador-project' }, 'user-1');
  });

  it('applies import JSON', async () => {
    const apply = vi.fn().mockResolvedValue({
      success: true,
      errors: [],
      summary: {
        tablesCreated: 0,
        tablesUpdated: 0,
        tablesDeleted: 0,
        fieldsCreated: 0,
        fieldsUpdated: 0,
        fieldsDeleted: 0,
        indexesCreated: 0,
        indexesUpdated: 0,
        indexesDeleted: 0,
      },
    });

    const res = await request(buildApp({}, { apply }))
      .post(`/api/v1/projects/${PROJECT.id}/import`)
      .set('Authorization', AUTH)
      .send({ document: { format: 'sxgerador-project' } });

    expect(res.status).toBe(200);
    expect(apply).toHaveBeenCalledWith(
      PROJECT.id,
      { format: 'sxgerador-project' },
      'user-1',
      undefined,
    );
  });

  it('exports CSV SX2', async () => {
    const exportCsv = vi.fn().mockResolvedValue({
      content: 'X2_CHAVE;X2_ARQUIVO\nZZZ;ZZZ010\n',
      fileName: 'sxgerador-financeiro-sx2-20260101.csv',
    });

    const res = await request(buildApp({}, {}, { exportCsv }))
      .get(`/api/v1/projects/${PROJECT.id}/export/csv/sx2`)
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(exportCsv).toHaveBeenCalledWith(PROJECT.id, 'sx2', 'user-1');
  });

  it('previews CSV import', async () => {
    const importPreview = vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      summary: null,
      tables: null,
      csvWarnings: [],
    });

    const res = await request(buildApp({}, {}, { importPreview }))
      .post(`/api/v1/projects/${PROJECT.id}/import/csv/preview`)
      .set('Authorization', AUTH)
      .send({ sx2: 'X2_CHAVE;X2_ARQUIVO\nZZZ;ZZZ010\n' });

    expect(res.status).toBe(200);
    expect(importPreview).toHaveBeenCalled();
  });
});
