import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient, Table } from '../../generated/prisma';
import { TablesService } from './tables.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
type MockedTable<T extends Record<string, AnyFn>> = { [K in keyof T]: ReturnType<typeof vi.fn> };

interface MockedPrisma {
  project: MockedTable<{ findFirst: AnyFn }>;
  table: MockedTable<{
    findMany: AnyFn;
    count: AnyFn;
    findFirst: AnyFn;
    findUnique: AnyFn;
    create: AnyFn;
    update: AnyFn;
  }>;
  auditLog: MockedTable<{ create: AnyFn }>;
  $transaction: ReturnType<typeof vi.fn>;
}

function mockPrisma(): MockedPrisma {
  return {
    project: { findFirst: vi.fn() },
    table: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

const PROJECT_ID = 'clwproject0000000000000001';
const TABLE_ID = 'clwtable00000000000000001';

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

const ACTIVE_PROJECT = { id: PROJECT_ID };

describe('TablesService', () => {
  let db: MockedPrisma;
  let service: TablesService;

  beforeEach(() => {
    db = mockPrisma();
    service = new TablesService(db as unknown as PrismaClient);
    db.auditLog.create.mockResolvedValue({} as never);
  });

  describe('list', () => {
    it('lists active tables with pagination', async () => {
      db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
      db.table.findMany.mockResolvedValue([TABLE]);
      db.table.count.mockResolvedValue(1);

      const result = await service.list(PROJECT_ID, { page: 1, pageSize: 10 });

      expect(db.table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: PROJECT_ID, deletedAt: null },
          orderBy: { prefix: 'asc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
    });

    it('filters by search term on prefix and name', async () => {
      db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
      db.table.findMany.mockResolvedValue([]);
      db.table.count.mockResolvedValue(0);

      await service.list(PROJECT_ID, { search: 'zzz' });

      expect(db.table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { prefix: { contains: 'zzz', mode: 'insensitive' } },
              { namePt: { contains: 'zzz', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('includes archived tables when includeArchived is true', async () => {
      db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
      db.table.findMany.mockResolvedValue([]);
      db.table.count.mockResolvedValue(0);

      await service.list(PROJECT_ID, { includeArchived: true });

      const call = db.table.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(call.where).not.toHaveProperty('deletedAt');
    });

    it('throws NOT_FOUND when project does not exist', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(service.list(PROJECT_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('get', () => {
    it('returns the table when found', async () => {
      db.table.findFirst.mockResolvedValue(TABLE);

      const result = await service.get(PROJECT_ID, TABLE_ID);

      expect(result).toBe(TABLE);
      expect(db.table.findFirst).toHaveBeenCalledWith({
        where: { id: TABLE_ID, projectId: PROJECT_ID, deletedAt: null },
      });
    });

    it('throws NOT_FOUND when table does not exist', async () => {
      db.table.findFirst.mockResolvedValue(null);

      await expect(service.get(PROJECT_ID, TABLE_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create', () => {
    const input = {
      prefix: 'ZZZ',
      fileName: 'ZZZ010',
      namePt: 'Contratos',
      nameEs: null,
      nameEn: null,
      routine: null,
      modeCompany: 'C' as const,
      modeUnit: 'C' as const,
      modeBranch: 'C' as const,
      ttsEnabled: 'S' as const,
      uniqueKey: null,
      pyme: 'N' as const,
      modules: 0,
      hasClob: 'N' as const,
      autoIncRec: 'N' as const,
      tamFil: 2,
      tamUn: 2,
      tamEmp: 2,
      notes: null,
    };

    it('creates a table when prefix is available', async () => {
      db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
      db.table.findUnique.mockResolvedValue(null);
      db.table.create.mockResolvedValue(TABLE);

      const result = await service.create(PROJECT_ID, input, 'user-1');

      expect(result).toBe(TABLE);
      expect(db.table.create).toHaveBeenCalledWith({
        data: { ...input, projectId: PROJECT_ID },
      });
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'tables.create', userId: 'user-1' }),
        }),
      );
    });

    it('rejects create when prefix is already in use in project', async () => {
      db.project.findFirst.mockResolvedValue(ACTIVE_PROJECT);
      db.table.findUnique.mockResolvedValue(TABLE);

      await expect(service.create(PROJECT_ID, input)).rejects.toMatchObject({ statusCode: 409 });
      expect(db.table.create).not.toHaveBeenCalled();
    });

    it('rejects create when project does not exist', async () => {
      db.project.findFirst.mockResolvedValue(null);

      await expect(service.create(PROJECT_ID, input)).rejects.toMatchObject({ statusCode: 404 });
      expect(db.table.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates an active table', async () => {
      db.table.findFirst.mockResolvedValue(TABLE);
      db.table.update.mockResolvedValue({ ...TABLE, namePt: 'Contratos SX' });

      await service.update(PROJECT_ID, TABLE_ID, { namePt: 'Contratos SX' }, 'user-1');

      expect(db.table.update).toHaveBeenCalledWith({
        where: { id: TABLE_ID },
        data: { namePt: 'Contratos SX' },
      });
    });

    it('throws NOT_FOUND when updating a non-existent table', async () => {
      db.table.findFirst.mockResolvedValue(null);

      await expect(service.update(PROJECT_ID, TABLE_ID, { namePt: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('soft-deletes an active table', async () => {
      db.table.findFirst.mockResolvedValue(TABLE);
      db.table.update.mockResolvedValue({ ...TABLE, deletedAt: new Date() });

      await service.delete(PROJECT_ID, TABLE_ID, 'user-1');

      expect(db.table.update).toHaveBeenCalledWith({
        where: { id: TABLE_ID },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('rejects soft-delete when table is already archived', async () => {
      db.table.findFirst.mockResolvedValue({ ...TABLE, deletedAt: new Date() });

      await expect(service.delete(PROJECT_ID, TABLE_ID)).rejects.toMatchObject({ statusCode: 409 });
      expect(db.table.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when table does not exist', async () => {
      db.table.findFirst.mockResolvedValue(null);

      await expect(service.delete(PROJECT_ID, TABLE_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('restore', () => {
    it('restores an archived table', async () => {
      db.table.findFirst.mockResolvedValue({ ...TABLE, deletedAt: new Date() });
      db.table.update.mockResolvedValue(TABLE);

      await service.restore(PROJECT_ID, TABLE_ID, 'user-1');

      expect(db.table.update).toHaveBeenCalledWith({
        where: { id: TABLE_ID },
        data: { deletedAt: null },
      });
    });

    it('rejects restore when table is not archived', async () => {
      db.table.findFirst.mockResolvedValue(TABLE);

      await expect(service.restore(PROJECT_ID, TABLE_ID)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(db.table.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when table does not exist', async () => {
      db.table.findFirst.mockResolvedValue(null);

      await expect(service.restore(PROJECT_ID, TABLE_ID)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
