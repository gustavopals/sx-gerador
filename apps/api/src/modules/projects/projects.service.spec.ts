import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient, Project } from '../../generated/prisma';
import { ProjectsService } from './projects.service';

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
  defaultTamFil: 2,
  defaultLang: 'pt-BR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

describe('ProjectsService', () => {
  let db: MockedPrisma;
  let service: ProjectsService;

  beforeEach(() => {
    db = mockPrisma();
    service = new ProjectsService(db as unknown as PrismaClient);
    db.auditLog.create.mockResolvedValue({} as never);
  });

  it('lists active projects with pagination and search', async () => {
    db.project.findMany.mockResolvedValue([PROJECT]);
    db.project.count.mockResolvedValue(1);

    const result = await service.list({ page: 2, pageSize: 10, search: 'fin' });

    expect(db.project.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: 'fin', mode: 'insensitive' } },
          { slug: { contains: 'fin', mode: 'insensitive' } },
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

  it('rejects create when slug is already in use', async () => {
    db.project.findUnique.mockResolvedValue(PROJECT);

    await expect(service.create({ name: 'Financeiro', slug: 'financeiro' })).rejects.toMatchObject({
      statusCode: 409,
    });
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
        defaultTamFil: 2,
        defaultLang: 'pt-BR',
      },
    });
  });
});
