import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Field, Index, PrismaClient, Project, Table } from '../../generated/prisma';
import { ProjectsService, type ProjectExportSnapshot } from './projects.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  project: MockedTable<{
    findMany: AnyFn;
    count: AnyFn;
    findFirst: AnyFn;
    findUnique: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  teamMember: MockedTable<{ findFirst: AnyFn }>;
  auditLog: MockedTable<{ create: AnyFn }>;
  $transaction: ReturnType<typeof vi.fn>;
}

function mockPrisma(): MockedPrisma {
  return {
    project: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

const PROJECT: Project = {
  id: 'clwproject0000000000000001',
  name: 'Financeiro',
  slug: 'financeiro',
  description: null,
  visibility: 'PRIVATE',
  ownerUserId: 'user-1',
  ownerTeamId: null,
  defaultTamFil: 2,
  defaultLang: 'pt-BR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const TEAM_ID = 'clwteam000000000000000001';
const TABLE_ID = 'clwtable00000000000000001';
const FIELD_ID = 'clwfield00000000000000001';
const INDEX_ID = 'clwindex00000000000000001';

const EXPORT_TABLE: Table = {
  id: TABLE_ID,
  projectId: PROJECT.id,
  prefix: 'ZZZ',
  fileName: 'ZZZ010',
  namePt: 'Contratos',
  nameEs: null,
  nameEn: null,
  routine: null,
  modeCompany: 'C',
  modeUnit: 'C',
  modeBranch: 'C',
  ttsEnabled: 'S',
  uniqueKey: null,
  pyme: 'N',
  modules: 0,
  hasClob: 'N',
  autoIncRec: 'N',
  tamFil: 2,
  tamUn: 2,
  tamEmp: 2,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const EXPORT_FIELD: Field = {
  id: FIELD_ID,
  tableId: TABLE_ID,
  name: 'ZZZ_CODIGO',
  order: '01',
  type: 'C',
  size: 10,
  decimals: 0,
  titlePt: 'Codigo',
  titleEs: null,
  titleEn: null,
  descPt: 'Codigo',
  descEs: null,
  descEn: null,
  picture: null,
  pictureVar: null,
  pictureBrowse: null,
  validation: null,
  userValidation: null,
  defaultRel: null,
  whenExpr: null,
  initBrowse: null,
  comboPt: null,
  comboEs: null,
  comboEn: null,
  searchKey: null,
  visualMode: 'A',
  contextMode: 'R',
  owner: 'U',
  required: null,
  showBrowse: 'S',
  hasCheck: 'N',
  hasTrigger: 'N',
  level: 0,
  pyme: 'N',
  serverIndex: 'N',
  fieldIndex: 'N',
  spelling: 'N',
  modal: 'N',
  positionLogix: 'N',
  usadoFlags: {},
  modulesFlags: {},
  sqlCondition: null,
  sqlCheck: null,
  groupSxg: null,
  folder: null,
  screen: null,
  grouping: null,
  reserved: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const EXPORT_INDEX: Index = {
  id: INDEX_ID,
  tableId: TABLE_ID,
  order: '1',
  key: 'ZZZ_FILIAL+ZZZ_CODIGO',
  descPt: 'Principal',
  descEs: null,
  descEn: null,
  owner: 'U',
  searchExpr: null,
  nickname: null,
  showSearch: 'S',
  isVirtual: 'N',
  virtualCustomizable: 'N',
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

const EXPORT_SNAPSHOT = {
  ...PROJECT,
  tables: [{ ...EXPORT_TABLE, fields: [EXPORT_FIELD], indexes: [EXPORT_INDEX] }],
} as unknown as ProjectExportSnapshot;

describe('ProjectsService', () => {
  let db: MockedPrisma;
  let service: ProjectsService;

  beforeEach(() => {
    db = mockPrisma();
    service = new ProjectsService(db as unknown as PrismaClient);
    db.auditLog.create.mockResolvedValue({} as never);
    db.project.findFirst.mockResolvedValue(PROJECT);
  });

  it('lists active projects with pagination and search', async () => {
    db.project.findMany.mockResolvedValue([PROJECT]);
    db.project.count.mockResolvedValue(1);

    const result = await service.list({ page: 2, pageSize: 10, search: 'fin' }, 'user-1');

    expect(db.project.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { ownerUserId: 'user-1' },
          { ownerTeam: { members: { some: { userId: 'user-1', removedAt: null } } } },
          { visibility: { in: ['PUBLIC', 'UNLISTED'] } },
        ],
        AND: [
          {
            OR: [
              { name: { contains: 'fin', mode: 'insensitive' } },
              { slug: { contains: 'fin', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('creates a project when slug is available', async () => {
    db.project.findUnique.mockResolvedValue(null);
    db.project.create.mockResolvedValue(PROJECT);

    const result = await service.create({ name: 'Financeiro', slug: 'financeiro' }, 'user-1');

    expect(result).toBe(PROJECT);
    expect(db.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Financeiro',
        slug: 'financeiro',
        description: null,
        visibility: 'PRIVATE',
        ownerUser: { connect: { id: 'user-1' } },
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
    });
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'projects.create', userId: 'user-1' }),
      }),
    );
  });

  it('creates a project owned by a team when the user is a member', async () => {
    db.project.findUnique.mockResolvedValue(null);
    db.teamMember.findFirst.mockResolvedValue({ id: 'membership-1' });
    db.project.create.mockResolvedValue({ ...PROJECT, ownerUserId: null, ownerTeamId: TEAM_ID });

    await service.create(
      { name: 'Financeiro', slug: 'financeiro', ownerTeamId: TEAM_ID },
      'user-1',
    );

    expect(db.teamMember.findFirst).toHaveBeenCalledWith({
      where: {
        teamId: TEAM_ID,
        userId: 'user-1',
        removedAt: null,
        team: { deletedAt: null },
      },
      select: { id: true },
    });
    expect(db.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Financeiro',
        slug: 'financeiro',
        description: null,
        visibility: 'PRIVATE',
        ownerTeam: { connect: { id: TEAM_ID } },
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
    });
  });

  it('rejects create when slug is already in use', async () => {
    db.project.findUnique.mockResolvedValue(PROJECT);

    await expect(
      service.create({ name: 'Financeiro', slug: 'financeiro' }, 'user-1'),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(db.project.create).not.toHaveBeenCalled();
  });

  it('updates an active project', async () => {
    db.project.findFirst.mockResolvedValue(PROJECT);
    db.project.findUnique.mockResolvedValue(null);
    db.project.update.mockResolvedValue({ ...PROJECT, name: 'Financeiro SX' });

    await service.update(PROJECT.id, { name: 'Financeiro SX', slug: 'financeiro-sx' }, 'user-1');

    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: PROJECT.id },
      data: { name: 'Financeiro SX', slug: 'financeiro-sx' },
    });
  });

  it('soft-deletes an active project', async () => {
    db.project.findUnique.mockResolvedValue(PROJECT);
    db.project.update.mockResolvedValue({ ...PROJECT, deletedAt: new Date() });

    await service.delete(PROJECT.id, 'user-1');

    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: PROJECT.id },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('rejects soft-delete when project is already archived', async () => {
    db.project.findUnique.mockResolvedValue({ ...PROJECT, deletedAt: new Date() });

    await expect(service.delete(PROJECT.id, 'user-1')).rejects.toMatchObject({ statusCode: 409 });
    expect(db.project.update).not.toHaveBeenCalled();
  });

  it('restores an archived project', async () => {
    db.project.findUnique.mockResolvedValue({ ...PROJECT, deletedAt: new Date() });
    db.project.update.mockResolvedValue(PROJECT);

    await service.restore(PROJECT.id, 'user-1');

    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: PROJECT.id },
      data: { deletedAt: null },
    });
  });

  it('duplicates a project with the next available copy slug', async () => {
    db.project.findFirst.mockResolvedValue(PROJECT);
    db.project.findUnique
      .mockResolvedValueOnce({ ...PROJECT, id: 'copy-1', slug: 'financeiro-copy' })
      .mockResolvedValueOnce(null);
    db.project.create.mockResolvedValue({
      ...PROJECT,
      id: 'clwproject0000000000000002',
      name: 'Financeiro (cópia)',
      slug: 'financeiro-copy-2',
    });

    const result = await service.duplicate(PROJECT.id, 'user-1');

    expect(result.slug).toBe('financeiro-copy-2');
    expect(db.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Financeiro (cópia)',
        slug: 'financeiro-copy-2',
        description: null,
        visibility: 'PRIVATE',
        ownerUser: { connect: { id: 'user-1' } },
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
    });
  });

  it('exports project JSON with tables, fields and indexes', async () => {
    db.project.findFirst
      .mockResolvedValueOnce(PROJECT)
      .mockResolvedValueOnce(PROJECT)
      .mockResolvedValueOnce(EXPORT_SNAPSHOT);

    const doc = await service.exportJson(PROJECT.id, 'user-1');

    expect(doc.format).toBe('sxgerador-project');
    expect(doc.formatVersion).toBe(1);
    expect(doc.project.id).toBe(PROJECT.id);
    expect(doc.tables).toHaveLength(1);
    expect(doc.tables[0].prefix).toBe('ZZZ');
    expect(doc.tables[0].fields).toHaveLength(1);
    expect(doc.tables[0].indexes).toHaveLength(1);
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'projects.export', userId: 'user-1' }),
      }),
    );
  });
});
