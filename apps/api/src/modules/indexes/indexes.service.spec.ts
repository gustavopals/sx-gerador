import { CreateIndexSchema } from '@sxgerador/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Index, PrismaClient } from '../../generated/prisma';
import { IndexesService } from './indexes.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  project: MockedTable<{ findFirst: AnyFn }>;
  table: MockedTable<{ findFirst: AnyFn }>;
  field: MockedTable<{ findMany: AnyFn }>;
  index: MockedTable<{
    findMany: AnyFn;
    count: AnyFn;
    findFirst: AnyFn;
    findUnique: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  $transaction: ReturnType<typeof vi.fn>;
}

function mockPrisma(): MockedPrisma {
  return {
    project: { findFirst: vi.fn() },
    table: { findFirst: vi.fn() },
    field: { findMany: vi.fn() },
    index: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

const PROJECT_ID = 'clwproject0000000000000001';
const TABLE_ID = 'clwtable00000000000000001';
const INDEX_ID = 'clwindex00000000000000001';

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

describe('IndexesService', () => {
  let db: MockedPrisma;
  let service: IndexesService;

  beforeEach(() => {
    db = mockPrisma();
    service = new IndexesService(db as unknown as PrismaClient);
    db.project.findFirst.mockResolvedValue({ id: PROJECT_ID });
    db.table.findFirst.mockResolvedValue({ id: TABLE_ID });
    db.index.findMany.mockResolvedValue([]);
    db.field.findMany.mockResolvedValue([{ name: 'ZZZ_FILIAL' }, { name: 'ZZZ_CODIGO' }]);
  });

  it('creates index when order and key are valid', async () => {
    db.index.findUnique.mockResolvedValue(null);
    db.index.create.mockResolvedValue(INDEX);

    const result = await service.create(
      PROJECT_ID,
      TABLE_ID,
      CreateIndexSchema.parse({
        order: '1',
        key: 'ZZZ_FILIAL+ZZZ_CODIGO',
        descPt: 'Principal',
      }),
    );

    expect(result.id).toBe(INDEX_ID);
    expect(db.index.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tableId: TABLE_ID,
          order: '1',
        }),
      }),
    );
  });

  it('rejects creating second index with order 1', async () => {
    db.index.findUnique.mockResolvedValue(null);
    db.index.findMany.mockResolvedValue([{ order: '1' }]);

    await expect(
      service.create(
        PROJECT_ID,
        TABLE_ID,
        CreateIndexSchema.parse({
          order: '1',
          key: 'ZZZ_FILIAL+ZZZ_CODIGO',
          descPt: 'Principal',
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('rejects key expression with unknown fields', async () => {
    db.index.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        PROJECT_ID,
        TABLE_ID,
        CreateIndexSchema.parse({
          order: '2',
          key: 'ZZZ_FILIAL+ZZZ_INEXISTENTE',
          descPt: 'Secundario',
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('updates index and validates changed order', async () => {
    db.index.findFirst.mockResolvedValue(INDEX);
    db.index.findUnique.mockResolvedValue(null);
    db.index.findMany.mockResolvedValue([{ order: '1' }]);
    db.index.update.mockResolvedValue({ ...INDEX, order: '2' });

    const result = await service.update(PROJECT_ID, TABLE_ID, INDEX_ID, {
      order: '2',
    });

    expect(result.order).toBe('2');
  });

  it('archives and restores index', async () => {
    db.index.findFirst.mockResolvedValueOnce(INDEX).mockResolvedValueOnce({
      ...INDEX,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    db.index.update
      .mockResolvedValueOnce({ ...INDEX, deletedAt: new Date('2026-01-02T00:00:00.000Z') })
      .mockResolvedValueOnce(INDEX);

    const archived = await service.delete(PROJECT_ID, TABLE_ID, INDEX_ID);
    expect(archived.deletedAt).not.toBeNull();

    const restored = await service.restore(PROJECT_ID, TABLE_ID, INDEX_ID);
    expect(restored.deletedAt).toBeNull();
  });
});
