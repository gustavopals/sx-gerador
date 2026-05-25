import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { createTemplatesRouter } from './templates.routes';
import type { TemplatesService } from './templates.service';

const SECRET = 'dev-access-secret-change-in-production';
const AUTH = `Bearer ${jwtSign({ sub: 'user-1', email: 'dev@example.com' }, SECRET, {
  expiresIn: '15m',
})}`;

const TEMPLATE = {
  id: 'clwtempl000000000000000001',
  authorId: null,
  name: 'Cadastro generico',
  description: 'Desc',
  category: 'Genéricos',
  sourceTablePrefix: 'ZGE',
  downloads: 10,
  isOfficial: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  authorName: null,
};

function buildApp(service: Partial<TemplatesService>) {
  const app = express();
  app.use(json());
  app.use('/api/v1', createTemplatesRouter(service as TemplatesService));
  app.use(errorHandler);
  return app;
}

describe('templates routes', () => {
  it('lists templates without auth', async () => {
    const list = vi.fn().mockResolvedValue({
      templates: [TEMPLATE],
      meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
    });

    const res = await request(buildApp({ list })).get('/api/v1/templates');

    expect(res.status).toBe(200);
    expect(list).toHaveBeenCalled();
  });

  it('creates template from table when authenticated', async () => {
    const createFromTable = vi.fn().mockResolvedValue(TEMPLATE);

    const res = await request(buildApp({ createFromTable }))
      .post('/api/v1/templates')
      .set('Authorization', AUTH)
      .send({
        name: 'Meu template',
        category: 'Genéricos',
        projectId: 'clwproject0000000000000001',
        tableId: 'clwtable00000000000000001',
      });

    expect(res.status).toBe(201);
    expect(createFromTable).toHaveBeenCalled();
  });

  it('previews apply', async () => {
    const previewApply = vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      targetPrefix: 'ZGE',
      summary: { tableName: 'Test', fieldsCount: 3, indexesCount: 1, action: 'create' },
    });

    const res = await request(buildApp({ previewApply }))
      .post(`/api/v1/templates/${TEMPLATE.id}/apply/preview`)
      .set('Authorization', AUTH)
      .send({ projectId: 'clwproject0000000000000001' });

    expect(res.status).toBe(200);
    expect(previewApply).toHaveBeenCalled();
  });
});
