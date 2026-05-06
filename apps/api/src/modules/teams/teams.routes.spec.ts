import express, { json } from 'express';
import { sign as jwtSign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/error.middleware';
import { createTeamsRouter } from './teams.routes';
import type { TeamsService } from './teams.service';

const SECRET = 'dev-access-secret-change-in-production';
const AUTH = `Bearer ${jwtSign(
  { sub: 'clwuser000000000000000001', email: 'dev@example.com' },
  SECRET,
  {
    expiresIn: '15m',
  },
)}`;
const TEAM_ID = 'clwteam000000000000000001';
const MEMBER_ID = 'clwmember000000000000001';
const PROJECT_ID = 'clwproject0000000000000001';

const TEAM = {
  id: TEAM_ID,
  name: 'Equipe Produto',
  slug: 'produto',
  description: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const INVITE = {
  id: 'clwinvite000000000000001',
  projectId: PROJECT_ID,
  email: 'dev@sxgerador.local',
  invitedById: 'clwuser000000000000000001',
  role: 'MEMBER',
  status: 'PENDING',
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildApp(service: Partial<TeamsService>) {
  const app = express();
  app.use(json({ limit: '2mb' }));
  app.use('/api/v1', createTeamsRouter(service as TeamsService));
  app.use(errorHandler);
  return app;
}

describe('teams routes', () => {
  it('requires auth for team list', async () => {
    const service = { list: vi.fn() };
    const res = await request(buildApp(service)).get('/api/v1/teams');
    expect(res.status).toBe(401);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('creates a team with validated payload', async () => {
    const service = { create: vi.fn().mockResolvedValue(TEAM) };

    const res = await request(buildApp(service))
      .post('/api/v1/teams')
      .set('Authorization', AUTH)
      .send({ name: 'Equipe Produto', slug: 'produto' });

    expect(res.status).toBe(201);
    expect(res.body.team).toMatchObject({ id: TEAM_ID, slug: 'produto' });
    expect(service.create).toHaveBeenCalledWith(
      { name: 'Equipe Produto', slug: 'produto' },
      'clwuser000000000000000001',
    );
  });

  it('rejects invalid team payload', async () => {
    const service = { create: vi.fn() };

    const res = await request(buildApp(service))
      .post('/api/v1/teams')
      .set('Authorization', AUTH)
      .send({ name: 'E', slug: 'Equipe Produto' });

    expect(res.status).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('invites a project member', async () => {
    const service = {
      inviteProjectMember: vi.fn().mockResolvedValue({ invite: INVITE, token: 'raw-token' }),
    };

    const res = await request(buildApp(service))
      .post('/api/v1/project-invites')
      .set('Authorization', AUTH)
      .send({ projectId: PROJECT_ID, email: 'DEV@SXGERADOR.LOCAL', role: 'MEMBER' });

    expect(res.status).toBe(201);
    expect(res.body.invite).toMatchObject({ id: INVITE.id, email: INVITE.email });
    expect(res.body.token).toBeUndefined();
    expect(service.inviteProjectMember).toHaveBeenCalledWith(
      { projectId: PROJECT_ID, email: 'dev@sxgerador.local', role: 'MEMBER' },
      'clwuser000000000000000001',
    );
  });

  it('accepts an invite token', async () => {
    const service = { acceptInvite: vi.fn().mockResolvedValue({ ...INVITE, status: 'ACCEPTED' }) };

    const res = await request(buildApp(service))
      .post('/api/v1/project-invites/accept')
      .set('Authorization', AUTH)
      .send({ token: 'a'.repeat(64) });

    expect(res.status).toBe(200);
    expect(service.acceptInvite).toHaveBeenCalledWith('a'.repeat(64), 'clwuser000000000000000001');
  });

  it('updates a member role', async () => {
    const service = {
      updateMemberRole: vi.fn().mockResolvedValue({
        id: MEMBER_ID,
        teamId: TEAM_ID,
        role: 'ADMIN',
      }),
    };

    const res = await request(buildApp(service))
      .patch(`/api/v1/teams/${TEAM_ID}/members/${MEMBER_ID}`)
      .set('Authorization', AUTH)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(service.updateMemberRole).toHaveBeenCalledWith(
      TEAM_ID,
      MEMBER_ID,
      { role: 'ADMIN' },
      'clwuser000000000000000001',
    );
  });

  it('transfers ownership', async () => {
    const service = {
      transferOwnership: vi.fn().mockResolvedValue({
        id: MEMBER_ID,
        teamId: TEAM_ID,
        role: 'OWNER',
      }),
    };

    const res = await request(buildApp(service))
      .post(`/api/v1/teams/${TEAM_ID}/transfer-ownership`)
      .set('Authorization', AUTH)
      .send({ userId: 'clwuser000000000000000002' });

    expect(res.status).toBe(200);
    expect(service.transferOwnership).toHaveBeenCalledWith(
      TEAM_ID,
      'clwuser000000000000000002',
      'clwuser000000000000000001',
    );
  });
});
