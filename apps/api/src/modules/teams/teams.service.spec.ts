import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PrismaClient,
  Project,
  ProjectInvite,
  Team,
  TeamMember,
  User,
} from '../../generated/prisma';
import { TeamsService, type TeamsMailer } from './teams.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  team: MockedTable<{
    findMany: AnyFn;
    findFirst: AnyFn;
    findUnique: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  teamMember: MockedTable<{
    findMany: AnyFn;
    findFirst: AnyFn;
    create: AnyFn;
    update: AnyFn;
    upsert: AnyFn;
    count: AnyFn;
  }>;
  project: MockedTable<{ findFirst: AnyFn }>;
  projectInvite: MockedTable<{
    findMany: AnyFn;
    findFirst: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  user: MockedTable<{ findFirst: AnyFn }>;
  auditLog: MockedTable<{ create: AnyFn }>;
  $transaction: ReturnType<typeof vi.fn>;
}

const USER_ID = 'clwuser000000000000000001';
const TEAM_ID = 'clwteam000000000000000001';
const PROJECT_ID = 'clwproject0000000000000001';
const MEMBER_ID = 'clwmember000000000000001';

const TEAM: Team = {
  id: TEAM_ID,
  name: 'Equipe Produto',
  slug: 'produto',
  description: null,
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const OWNER_MEMBER: TeamMember = {
  id: MEMBER_ID,
  teamId: TEAM_ID,
  userId: USER_ID,
  role: 'OWNER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  removedAt: null,
};

const PROJECT: Project & { ownerTeam: Team } = {
  id: PROJECT_ID,
  name: 'Projeto Produto',
  slug: 'produto',
  description: null,
  visibility: 'PRIVATE',
  ownerUserId: null,
  ownerTeamId: TEAM_ID,
  defaultTamFil: 2,
  defaultLang: 'pt-BR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ownerTeam: TEAM,
};

const INVITE: ProjectInvite = {
  id: 'clwinvite000000000000001',
  projectId: PROJECT_ID,
  email: 'dev@sxgerador.local',
  invitedById: USER_ID,
  role: 'MEMBER',
  tokenHash: hashToken('raw-invite-token'),
  status: 'PENDING',
  expiresAt: new Date(Date.now() + 60_000),
  acceptedAt: null,
  rejectedAt: null,
  revokedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const USER: User = {
  id: USER_ID,
  email: 'dev@sxgerador.local',
  passwordHash: 'hash',
  name: 'Dev',
  avatarUrl: null,
  emailVerified: true,
  locale: 'pt-BR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
  deletedAt: null,
  hardDeleteScheduledAt: null,
};

function mockPrisma(): MockedPrisma {
  const db = {
    team: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    teamMember: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    project: { findFirst: vi.fn() },
    projectInvite: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((operation: unknown) =>
      typeof operation === 'function'
        ? (operation as (tx: MockedPrisma) => unknown)(db as MockedPrisma)
        : Promise.all(operation as Promise<unknown>[]),
    ),
  };
  return db;
}

describe('TeamsService', () => {
  let db: MockedPrisma;
  let mailer: TeamsMailer;
  let service: TeamsService;

  beforeEach(() => {
    db = mockPrisma();
    mailer = { sendProjectInviteEmail: vi.fn().mockResolvedValue(undefined) };
    service = new TeamsService(db as unknown as PrismaClient, mailer);
    db.auditLog.create.mockResolvedValue({});
  });

  it('creates a team and adds the creator as owner', async () => {
    db.team.findUnique.mockResolvedValue(null);
    db.team.create.mockResolvedValue(TEAM);
    db.teamMember.create.mockResolvedValue(OWNER_MEMBER);

    const result = await service.create({ name: 'Equipe Produto', slug: 'produto' }, USER_ID);

    expect(result).toBe(TEAM);
    expect(db.team.create).toHaveBeenCalledWith({
      data: {
        name: 'Equipe Produto',
        slug: 'produto',
        description: null,
        avatarUrl: null,
      },
    });
    expect(db.teamMember.create).toHaveBeenCalledWith({
      data: { teamId: TEAM_ID, userId: USER_ID, role: 'OWNER' },
    });
  });

  it('creates a project invite, stores only the token hash and sends the raw token by mail', async () => {
    db.project.findFirst.mockResolvedValue(PROJECT);
    db.teamMember.findFirst.mockResolvedValueOnce(OWNER_MEMBER).mockResolvedValueOnce(null);
    db.projectInvite.findFirst.mockResolvedValue(null);
    db.projectInvite.create.mockResolvedValue(INVITE);

    const result = await service.inviteProjectMember(
      { projectId: PROJECT_ID, email: 'dev@sxgerador.local', role: 'MEMBER' },
      USER_ID,
    );

    expect(result.invite).toBe(INVITE);
    expect(result.token).toHaveLength(64);
    expect(db.projectInvite.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: PROJECT_ID,
        email: 'dev@sxgerador.local',
        invitedById: USER_ID,
        role: 'MEMBER',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(mailer.sendProjectInviteEmail).toHaveBeenCalledWith(
      'dev@sxgerador.local',
      result.token,
      expect.objectContaining({ projectName: PROJECT.name, teamName: TEAM.name }),
    );
  });

  it('accepts an invite and upserts the user into the owner team', async () => {
    db.user.findFirst.mockResolvedValue(USER);
    db.projectInvite.findFirst.mockResolvedValue(INVITE);
    db.project.findFirst.mockResolvedValue(PROJECT);
    db.teamMember.upsert.mockResolvedValue({ ...OWNER_MEMBER, role: 'MEMBER' });
    db.projectInvite.update.mockResolvedValue({ ...INVITE, status: 'ACCEPTED' });

    const result = await service.acceptInvite('raw-invite-token', USER_ID);

    expect(result.status).toBe('ACCEPTED');
    expect(db.projectInvite.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('raw-invite-token'), status: 'PENDING' },
    });
    expect(db.teamMember.upsert).toHaveBeenCalledWith({
      where: { teamId_userId: { teamId: TEAM_ID, userId: USER_ID } },
      update: { role: 'MEMBER', removedAt: null },
      create: { teamId: TEAM_ID, userId: USER_ID, role: 'MEMBER' },
    });
  });

  it('does not remove the last owner', async () => {
    db.teamMember.findFirst.mockResolvedValueOnce(OWNER_MEMBER).mockResolvedValueOnce(OWNER_MEMBER);
    db.teamMember.count.mockResolvedValue(0);

    await expect(service.removeMember(TEAM_ID, MEMBER_ID, USER_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(db.teamMember.update).not.toHaveBeenCalled();
  });
});

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
