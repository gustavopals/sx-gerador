import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Field, Index, PrismaClient, Table, Template } from '../../generated/prisma';
import { TemplatesService } from './templates.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  project: MockedTable<{ findFirst: AnyFn }>;
  table: MockedTable<{ findFirst: AnyFn; findUnique: AnyFn; create: AnyFn }>;
  field: MockedTable<{ create: AnyFn }>;
  index: MockedTable<{ create: AnyFn }>;
  template: MockedTable<{
    findUnique: AnyFn;
    findMany: AnyFn;
    count: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  migration: MockedTable<{ findFirst: AnyFn; aggregate: AnyFn; create: AnyFn }>;
  migrationItem: MockedTable<{ create: AnyFn }>;
  auditLog: MockedTable<{ create: AnyFn }>;
  $transaction: ReturnType<typeof vi.fn>;
}

const USER_ID = 'user-1';
const PROJECT_ID = 'clwproject0000000000000001';
const TABLE_ID = 'clwtable00000000000000001';
const FIELD_ID = 'clwfield00000000000000001';
const INDEX_ID = 'clwindex00000000000000001';
const TEMPLATE_ID = 'clwtempl0000000000000001';

const ACTIVE_PROJECT = {
  id: PROJECT_ID,
  visibility: 'PRIVATE',
  ownerUserId: USER_ID,
  ownerTeamId: null,
  ownerTeam: null,
};

const VIEWER_PROJECT = {
  id: PROJECT_ID,
  visibility: 'PRIVATE',
  ownerUserId: null,
  ownerTeamId: 'clwteam000000000000000001',
  ownerTeam: { members: [{ role: 'VIEWER' }] },
};

const TABLE: Table = {
  id: TABLE_ID,
  projectId: PROJECT_ID,
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
  uniqueKey: 'ZZZ_FILIAL+ZZZ_CODIGO',
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

const FIELD_FILIAL: Field = {
  id: 'clwfield00000000000000000',
  tableId: TABLE_ID,
  name: 'ZZZ_FILIAL',
  order: '01',
  type: 'C',
  size: 2,
  decimals: 0,
  titlePt: 'Filial',
  titleEs: null,
  titleEn: null,
  descPt: 'Filial',
  descEs: null,
  descEn: null,
  picture: '@!',
  pictureVar: null,
  pictureBrowse: null,
  validation: null,
  userValidation: null,
  defaultRel: "xFilial('ZZZ')",
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

const FIELD_CODIGO: Field = {
  ...FIELD_FILIAL,
  id: FIELD_ID,
  name: 'ZZZ_CODIGO',
  order: '02',
  size: 10,
  titlePt: 'Codigo',
  descPt: 'Codigo',
  defaultRel: null,
  validation: "ZZZ_CODIGO != ''",
  sqlCondition: 'ZZZ_CODIGO IS NOT NULL',
};

const INDEX: Index = {
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

const TEMPLATE_CONTENT = {
  formatVersion: 1,
  table: {
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
    uniqueKey: 'ZZZ_FILIAL+ZZZ_CODIGO',
    pyme: 'N',
    modules: 0,
    hasClob: 'N',
    autoIncRec: 'N',
    tamFil: 2,
    tamUn: 2,
    tamEmp: 2,
    notes: null,
  },
  fields: [
    {
      name: 'ZZZ_FILIAL',
      order: '01',
      type: 'C',
      size: 2,
      decimals: 0,
      titlePt: 'Filial',
      titleEs: null,
      titleEn: null,
      descPt: 'Filial',
      descEs: null,
      descEn: null,
      picture: '@!',
      defaultRel: "xFilial('ZZZ')",
      showBrowse: 'S',
      visualMode: 'A',
      contextMode: 'R',
      owner: 'U',
      usadoFlags: {},
      modulesFlags: {},
    },
    {
      name: 'ZZZ_CODIGO',
      order: '02',
      type: 'C',
      size: 10,
      decimals: 0,
      titlePt: 'Codigo',
      titleEs: null,
      titleEn: null,
      descPt: 'Codigo',
      descEs: null,
      descEn: null,
      validation: "ZZZ_CODIGO != ''",
      sqlCondition: 'ZZZ_CODIGO IS NOT NULL',
      showBrowse: 'S',
      visualMode: 'A',
      contextMode: 'R',
      owner: 'U',
      usadoFlags: {},
      modulesFlags: {},
    },
  ],
  indexes: [
    {
      order: '1',
      key: 'ZZZ_FILIAL+ZZZ_CODIGO',
      descPt: 'Principal',
      descEs: null,
      descEn: null,
      owner: 'U',
      showSearch: 'S',
      isVirtual: 'N',
      virtualCustomizable: 'N',
    },
  ],
};

const TEMPLATE: Template = {
  id: TEMPLATE_ID,
  authorId: null,
  name: 'Template contratos',
  description: null,
  category: 'Genéricos',
  content: TEMPLATE_CONTENT,
  sourceTablePrefix: 'ZZZ',
  downloads: 0,
  isOfficial: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function mockPrisma(): MockedPrisma {
  const db = {
    project: { findFirst: vi.fn() },
    table: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    field: { create: vi.fn() },
    index: { create: vi.fn() },
    template: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    migration: { findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn() },
    migrationItem: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((operation: unknown) =>
      typeof operation === 'function'
        ? (operation as (tx: MockedPrisma) => unknown)(db as MockedPrisma)
        : Promise.all(operation as Promise<unknown>[]),
    ),
  };
  return db;
}

describe('TemplatesService', () => {
  let db: MockedPrisma;
  let service: TemplatesService;

  beforeEach(() => {
    db = mockPrisma();
    service = new TemplatesService(db as unknown as PrismaClient, {} as never);
    db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
    db.template.findUnique.mockResolvedValue({ ...TEMPLATE, author: null });
    db.table.findUnique.mockResolvedValue(null);
    db.table.create.mockResolvedValue({ ...TABLE, prefix: 'Z99', fileName: 'Z99010' });
    db.field.create
      .mockResolvedValueOnce({ ...FIELD_FILIAL, tableId: TABLE_ID, name: 'Z99_FILIAL' })
      .mockResolvedValueOnce({ ...FIELD_CODIGO, tableId: TABLE_ID, name: 'Z99_CODIGO' });
    db.index.create.mockResolvedValue({
      ...INDEX,
      tableId: TABLE_ID,
      key: 'Z99_FILIAL+Z99_CODIGO',
    });
    db.template.update.mockResolvedValue(TEMPLATE);
    db.migration.findFirst.mockResolvedValue(null);
    db.migration.aggregate.mockResolvedValue({ _max: { sequence: null } });
    db.migration.create.mockResolvedValue({ id: 'clwmigration000000000001' });
    db.migrationItem.create.mockResolvedValue({});
    db.auditLog.create.mockResolvedValue({});
  });

  it('does not allow viewers to publish a table as a public template', async () => {
    db.project.findFirst.mockResolvedValue(VIEWER_PROJECT);

    await expect(
      service.createFromTable(
        {
          name: 'Template',
          category: 'Genéricos',
          projectId: PROJECT_ID,
          tableId: TABLE_ID,
        },
        USER_ID,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(db.template.create).not.toHaveBeenCalled();
  });

  it('rejects applying a template when the prefix exists, including archived tables', async () => {
    db.table.findUnique.mockResolvedValue({ ...TABLE, deletedAt: new Date('2026-01-02') });

    const preview = await service.previewApply(TEMPLATE_ID, { projectId: PROJECT_ID }, USER_ID);

    expect(preview.valid).toBe(false);
    expect(preview.errors[0]).toContain('já está em uso');
  });

  it('caches template listing in memory for repeated gallery requests', async () => {
    db.template.findMany.mockResolvedValue([{ ...TEMPLATE, author: null }]);
    db.template.count.mockResolvedValue(1);

    const first = await service.list({ page: 1, pageSize: 12 });
    const second = await service.list({ page: 1, pageSize: 12 });

    expect(first).toEqual(second);
    expect(db.template.findMany).toHaveBeenCalledTimes(1);
    expect(db.template.count).toHaveBeenCalledTimes(1);
  });

  it('applies a template with prefix remap and records migration items', async () => {
    const result = await service.apply(
      TEMPLATE_ID,
      { projectId: PROJECT_ID, prefixOverride: 'Z99' },
      USER_ID,
    );

    expect(result).toEqual({ success: true, errors: [], tableId: TABLE_ID, prefix: 'Z99' });
    expect(db.table.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: PROJECT_ID,
        prefix: 'Z99',
        fileName: 'Z99010',
        uniqueKey: 'Z99_FILIAL+Z99_CODIGO',
      }),
    });
    expect(db.field.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Z99_CODIGO',
          validation: "Z99_CODIGO != ''",
          sqlCondition: 'Z99_CODIGO IS NOT NULL',
        }),
      }),
    );
    expect(db.index.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: 'Z99_FILIAL+Z99_CODIGO' }),
    });
    expect(db.migration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: PROJECT_ID, sequence: 1, createdBy: USER_ID }),
      }),
    );
    expect(db.migrationItem.create).toHaveBeenCalledTimes(4);
    expect(db.migrationItem.create.mock.calls.map(([arg]) => arg.data.operation)).toEqual([
      'CREATE_TABLE',
      'CREATE_FIELD',
      'CREATE_FIELD',
      'CREATE_INDEX',
    ]);
  });
});
