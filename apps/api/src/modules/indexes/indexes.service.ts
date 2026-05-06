import { validateIndexKeyFields, validatePrimaryIndexOrder } from '@sxgerador/dictionary-validator';
import type { CreateIndexData, UpdateIndexInput } from '@sxgerador/shared-types';
import type { Index, Prisma, PrismaClient } from '../../generated/prisma';
import type { MigrationsService } from '../migrations/migrations.service';
import { assertProjectPermission } from '../permissions';
import { ProjectErrors } from '../projects/projects.errors';
import { IndexErrors } from './indexes.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ListIndexesInput {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface PaginatedIndexes {
  indexes: Index[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class IndexesService {
  constructor(
    private readonly db: PrismaClient,
    private readonly migrationsService?: MigrationsService,
  ) {}

  async list(
    projectId: string,
    tableId: string,
    input: ListIndexesInput = {},
    actorUserId?: string,
  ): Promise<PaginatedIndexes> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectId);

    const page = normalizePositiveInt(input.page, DEFAULT_PAGE);
    const pageSize = Math.min(
      normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const where = buildListWhere(tableId, input);
    const [indexes, total] = await this.db.$transaction([
      this.db.index.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.index.count({ where }),
    ]);

    return {
      indexes,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async get(projectId: string, tableId: string, id: string, actorUserId?: string): Promise<Index> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectId);
    const index = await this.db.index.findFirst({
      where: { id, tableId, deletedAt: null },
    });
    if (!index) throw IndexErrors.NOT_FOUND;
    return index;
  }

  async create(
    projectId: string,
    tableId: string,
    input: CreateIndexData,
    actorUserId?: string,
  ): Promise<Index> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);
    await this.ensureIndexOrderAvailable(tableId, input.order);
    await this.ensurePrimaryOrderRule(tableId, input.order);
    await this.ensureIndexKeyFieldsExist(tableId, input.key);

    const index = await this.db.index.create({
      data: {
        ...input,
        tableId,
      },
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'CREATE_INDEX',
      targetType: 'INDEX',
      targetId: index.id,
      targetName: index.key,
      beforeState: null,
      afterState: index as unknown as Prisma.JsonValue,
    });
    return index;
  }

  async update(
    projectId: string,
    tableId: string,
    id: string,
    input: UpdateIndexInput,
    actorUserId?: string,
  ): Promise<Index> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);
    const current = await this.db.index.findFirst({ where: { id, tableId } });
    if (!current) throw IndexErrors.NOT_FOUND;

    if (input.order !== undefined) {
      await this.ensureIndexOrderAvailable(tableId, input.order, id);
      await this.ensurePrimaryOrderRule(tableId, input.order, current.order);
    }
    if (input.key !== undefined) {
      await this.ensureIndexKeyFieldsExist(tableId, input.key);
    }

    const updated = await this.db.index.update({
      where: { id },
      data: buildUpdateData(input),
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'ALTER_INDEX',
      targetType: 'INDEX',
      targetId: updated.id,
      targetName: updated.key,
      beforeState: current as unknown as Prisma.JsonValue,
      afterState: updated as unknown as Prisma.JsonValue,
    });
    return updated;
  }

  async delete(
    projectId: string,
    tableId: string,
    id: string,
    actorUserId?: string,
  ): Promise<Index> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);
    const index = await this.db.index.findFirst({ where: { id, tableId } });
    if (!index) throw IndexErrors.NOT_FOUND;
    if (index.deletedAt) throw IndexErrors.ALREADY_ARCHIVED;

    const archived = await this.db.index.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'DROP_INDEX',
      targetType: 'INDEX',
      targetId: index.id,
      targetName: index.key,
      beforeState: index as unknown as Prisma.JsonValue,
      afterState: null,
    });
    return archived;
  }

  async restore(
    projectId: string,
    tableId: string,
    id: string,
    actorUserId?: string,
  ): Promise<Index> {
    await this.ensureTableExists(projectId, tableId);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);
    const index = await this.db.index.findFirst({ where: { id, tableId } });
    if (!index) throw IndexErrors.NOT_FOUND;
    if (!index.deletedAt) throw IndexErrors.NOT_ARCHIVED;

    const restored = await this.db.index.update({
      where: { id },
      data: { deletedAt: null },
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'ALTER_INDEX',
      targetType: 'INDEX',
      targetId: restored.id,
      targetName: restored.key,
      beforeState: index as unknown as Prisma.JsonValue,
      afterState: restored as unknown as Prisma.JsonValue,
    });
    return restored;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw ProjectErrors.NOT_FOUND;
  }

  private async ensureTableExists(projectId: string, tableId: string): Promise<void> {
    await this.ensureProjectExists(projectId);
    const table = await this.db.table.findFirst({
      where: { id: tableId, projectId, deletedAt: null },
      select: { id: true },
    });
    if (!table) throw IndexErrors.NOT_FOUND;
  }

  private async ensureIndexOrderAvailable(
    tableId: string,
    order: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.db.index.findUnique({
      where: { tableId_order: { tableId, order } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) throw IndexErrors.ORDER_IN_USE;
  }

  private async ensurePrimaryOrderRule(
    tableId: string,
    order: string,
    currentOrder?: string,
  ): Promise<void> {
    const activeIndexes = await this.db.index.findMany({
      where: { tableId, deletedAt: null },
      select: { order: true },
    });
    const validation = validatePrimaryIndexOrder({
      existingOrders: activeIndexes.map((index) => index.order),
      order,
      currentOrder,
    });
    if (!validation.valid) throw IndexErrors.PRIMARY_ORDER_CONFLICT;
  }

  private async ensureIndexKeyFieldsExist(tableId: string, keyExpression: string): Promise<void> {
    const activeFields = await this.db.field.findMany({
      where: { tableId, deletedAt: null },
      select: { name: true },
    });
    const validation = validateIndexKeyFields(
      keyExpression,
      activeFields.map((field) => field.name),
    );
    if (!validation.valid) throw IndexErrors.INVALID_KEY_FIELDS;
  }
}

function buildListWhere(tableId: string, input: ListIndexesInput): Prisma.IndexWhereInput {
  const where: Prisma.IndexWhereInput = { tableId };
  if (!input.includeArchived) where.deletedAt = null;

  const search = input.search?.trim();
  if (search) {
    where.OR = [
      { key: { contains: search, mode: 'insensitive' } },
      { descPt: { contains: search, mode: 'insensitive' } },
      { nickname: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value < 1) return fallback;
  return value;
}

function buildUpdateData(input: UpdateIndexInput): Prisma.IndexUpdateInput {
  const data: Prisma.IndexUpdateInput = {};

  if (input.order !== undefined) data.order = input.order;
  if (input.key !== undefined) data.key = input.key;
  if (input.descPt !== undefined) data.descPt = input.descPt;
  if (input.descEs !== undefined) data.descEs = input.descEs ?? null;
  if (input.descEn !== undefined) data.descEn = input.descEn ?? null;
  if (input.owner !== undefined) data.owner = input.owner;
  if (input.searchExpr !== undefined) data.searchExpr = input.searchExpr ?? null;
  if (input.nickname !== undefined) data.nickname = input.nickname ?? null;
  if (input.showSearch !== undefined) data.showSearch = input.showSearch;
  if (input.isVirtual !== undefined) data.isVirtual = input.isVirtual;
  if (input.virtualCustomizable !== undefined) data.virtualCustomizable = input.virtualCustomizable;
  if (input.notes !== undefined) data.notes = input.notes ?? null;

  return data;
}
