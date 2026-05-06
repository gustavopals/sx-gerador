import { CreateFieldSchema } from '@sxgerador/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Field, PrismaClient } from '../../generated/prisma';
import { FieldsService } from './fields.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  project: MockedTable<{ findFirst: AnyFn }>;
  table: MockedTable<{ findFirst: AnyFn }>;
  field: MockedTable<{
    findMany: AnyFn;
    count: AnyFn;
    findFirst: AnyFn;
    findUnique: AnyFn;
    create: AnyFn;
    update: AnyFn;
    updateMany: AnyFn;
  }>;
  $transaction: ReturnType<typeof vi.fn>;
}

function mockPrisma(): MockedPrisma {
  return {
    project: { findFirst: vi.fn() },
    table: { findFirst: vi.fn() },
    field: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

const PROJECT_ID = 'clwproject0000000000000001';
const TABLE_ID = 'clwtable00000000000000001';
const FIELD_ID = 'clwfield00000000000000001';

const FIELD: Field = {
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

describe('FieldsService', () => {
  let db: MockedPrisma;
  let service: FieldsService;

  beforeEach(() => {
    db = mockPrisma();
    service = new FieldsService(db as unknown as PrismaClient);
    db.project.findFirst.mockResolvedValue({
      id: PROJECT_ID,
      visibility: 'PRIVATE',
      ownerUserId: 'user-1',
      ownerTeamId: null,
      ownerTeam: null,
    });
    db.table.findFirst.mockResolvedValue({ id: TABLE_ID, prefix: 'ZZZ' });
  });

  it('creates field auto-generating order when not provided', async () => {
    db.field.findUnique.mockResolvedValue(null);
    db.field.findFirst.mockResolvedValue({ order: '01' });
    db.field.create.mockResolvedValue({ ...FIELD, order: '02' });

    const result = await service.create(
      PROJECT_ID,
      TABLE_ID,
      CreateFieldSchema.parse({
        name: 'ZZZ_NOME',
        type: 'C',
        size: 40,
        decimals: 0,
        titlePt: 'Nome',
        descPt: 'Nome',
      }),
      'user-1',
    );

    expect(result.order).toBe('02');
    expect(db.field.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: '02', tableId: TABLE_ID }),
      }),
    );
  });

  it('rejects field names outside the table prefix', async () => {
    await expect(
      service.create(
        PROJECT_ID,
        TABLE_ID,
        CreateFieldSchema.parse({
          name: 'AAA_NOME',
          type: 'C',
          size: 40,
          decimals: 0,
          titlePt: 'Nome',
          descPt: 'Nome',
        }),
        'user-1',
      ),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(db.field.create).not.toHaveBeenCalled();
  });

  it('updates a field', async () => {
    db.field.findFirst.mockResolvedValueOnce(FIELD).mockResolvedValueOnce(FIELD);
    db.field.update.mockResolvedValue({ ...FIELD, titlePt: 'Codigo Novo' });

    const result = await service.update(
      PROJECT_ID,
      TABLE_ID,
      FIELD_ID,
      { titlePt: 'Codigo Novo' },
      'user-1',
    );
    expect(result.titlePt).toBe('Codigo Novo');
  });

  it('reorders active fields', async () => {
    const id1 = 'clwfield00000000000000001';
    const id2 = 'clwfield00000000000000002';
    db.field.findMany.mockResolvedValueOnce([{ id: id1 }, { id: id2 }]).mockResolvedValueOnce([
      { ...FIELD, id: id2, order: '01' },
      { ...FIELD, id: id1, order: '02' },
    ]);
    db.field.update.mockResolvedValue(FIELD);

    const result = await service.reorder(PROJECT_ID, TABLE_ID, { fieldIds: [id2, id1] }, 'user-1');
    expect(db.$transaction).toHaveBeenCalled();
    expect(result[0].id).toBe(id2);
  });

  it('bulk updates active fields', async () => {
    db.field.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.bulkUpdate(
      PROJECT_ID,
      TABLE_ID,
      {
        fieldIds: ['clwfield00000000000000001', 'clwfield00000000000000002'],
        changes: { showBrowse: 'N' },
      },
      'user-1',
    );

    expect(result.updatedCount).toBe(2);
    expect(db.field.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tableId: TABLE_ID, deletedAt: null }),
        data: expect.objectContaining({ showBrowse: 'N' }),
      }),
    );
  });
});
