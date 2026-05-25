import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { createDiffRouter } from './diff.routes';
import type { DiffService } from './diff.service';

const SECRET = 'dev-access-secret-change-in-production';
const AUTH = `Bearer ${jwtSign({ sub: 'user-1', email: 'dev@example.com' }, SECRET, {
  expiresIn: '15m',
})}`;

function buildApp(service: Partial<DiffService>) {
  const app = express();
  app.use(json());
  app.use('/api/v1', createDiffRouter(service as DiffService));
  app.use(errorHandler);
  return app;
}

describe('diff routes', () => {
  it('compares two projects', async () => {
    const compareProjects = vi.fn().mockResolvedValue({
      projectA: { id: 'a', name: 'A', slug: 'a' },
      projectB: { id: 'b', name: 'B', slug: 'b' },
      diff: { tables: [], summary: {} },
    });

    const res = await request(buildApp({ compareProjects }))
      .post('/api/v1/diff/projects')
      .set('Authorization', AUTH)
      .send({
        projectIdA: 'clwproject0000000000000001',
        projectIdB: 'clwproject0000000000000002',
      });

    expect(res.status).toBe(200);
    expect(compareProjects).toHaveBeenCalled();
  });

  it('compares two migrations', async () => {
    const compareMigrations = vi.fn().mockResolvedValue({
      migrationA: { id: 'm1', name: 'M1', sequence: 1 },
      migrationB: { id: 'm2', name: 'M2', sequence: 2 },
      dictionaryDiff: { tables: [], summary: {} },
      itemsDiff: { onlyInA: [], onlyInB: [], changed: [], summary: {} },
    });

    const res = await request(buildApp({ compareMigrations }))
      .post('/api/v1/diff/migrations')
      .set('Authorization', AUTH)
      .send({
        projectId: 'clwproject0000000000000001',
        migrationIdA: 'clwmigration000000000000001',
        migrationIdB: 'clwmigration000000000000002',
      });

    expect(res.status).toBe(200);
    expect(compareMigrations).toHaveBeenCalled();
  });
});
