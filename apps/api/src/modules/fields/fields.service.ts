import { validateFieldName } from '@sxgerador/dictionary-validator';
import type { CreateFieldData, UpdateFieldInput } from '@sxgerador/shared-types';
import type { Field, Prisma, PrismaClient } from '../../generated/prisma';
import type { MigrationsService } from '../migrations/migrations.service';
import { ProjectErrors } from '../projects/projects.errors';
import { FieldErrors } from './fields.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ListFieldsInput {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface PaginatedFields {
  fields: Field[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ReorderFieldsInput {
  fieldIds: string[];
}

export interface BulkUpdateFieldsInput {
  fieldIds: string[];
  changes: UpdateFieldInput;
}

interface TableContext {
  id: string;
  prefix: string;
}

export class FieldsService {
  constructor(
    private readonly db: PrismaClient,
    private readonly migrationsService?: MigrationsService,
  ) {}

  async list(
    projectId: string,
    tableId: string,
    input: ListFieldsInput = {},
  ): Promise<PaginatedFields> {
    await this.ensureTableExists(projectId, tableId);

    const page = normalizePositiveInt(input.page, DEFAULT_PAGE);
    const pageSize = Math.min(
      normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const where = buildListWhere(tableId, input);
    const [fields, total] = await this.db.$transaction([
      this.db.field.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.field.count({ where }),
    ]);

    return {
      fields,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async get(projectId: string, tableId: string, id: string): Promise<Field> {
    await this.ensureTableExists(projectId, tableId);
    const field = await this.db.field.findFirst({
      where: { id, tableId, deletedAt: null },
    });
    if (!field) throw FieldErrors.NOT_FOUND;
    return field;
  }

  async create(projectId: string, tableId: string, input: CreateFieldData): Promise<Field> {
    const table = await this.ensureTableExists(projectId, tableId);
    this.ensureFieldNameMatchesTable(input.name, table.prefix);

    await this.ensureFieldNameAvailable(tableId, input.name);
    const order = input.order ?? (await this.generateNextOrder(tableId));
    await this.ensureFieldOrderAvailable(tableId, order);

    const field = await this.db.field.create({
      data: {
        ...input,
        usadoFlags: input.usadoFlags as Prisma.InputJsonValue,
        modulesFlags: input.modulesFlags as Prisma.InputJsonValue,
        tableId,
        order,
      },
    });

    await this.migrationsService?.recordChange({
      projectId,
      operation: 'CREATE_FIELD',
      targetType: 'FIELD',
      targetId: field.id,
      targetName: field.name,
      beforeState: null,
      afterState: field as unknown as Prisma.JsonValue,
    });
    return field;
  }

  async update(
    projectId: string,
    tableId: string,
    id: string,
    input: UpdateFieldInput,
  ): Promise<Field> {
    const table = await this.ensureTableExists(projectId, tableId);
    const before = await this.get(projectId, tableId, id);

    if (input.name) {
      this.ensureFieldNameMatchesTable(input.name, table.prefix);
      await this.ensureFieldNameAvailable(tableId, input.name, id);
    }
    if (input.order) await this.ensureFieldOrderAvailable(tableId, input.order, id);

    const field = await this.db.field.update({
      where: { id },
      data: buildUpdateData(input),
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'ALTER_FIELD',
      targetType: 'FIELD',
      targetId: field.id,
      targetName: field.name,
      beforeState: before as unknown as Prisma.JsonValue,
      afterState: field as unknown as Prisma.JsonValue,
    });
    return field;
  }

  async delete(projectId: string, tableId: string, id: string): Promise<Field> {
    await this.ensureTableExists(projectId, tableId);
    const field = await this.db.field.findFirst({ where: { id, tableId } });
    if (!field) throw FieldErrors.NOT_FOUND;
    if (field.deletedAt) throw FieldErrors.ALREADY_ARCHIVED;

    const archived = await this.db.field.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'DROP_FIELD',
      targetType: 'FIELD',
      targetId: field.id,
      targetName: field.name,
      beforeState: field as unknown as Prisma.JsonValue,
      afterState: null,
    });
    return archived;
  }

  async restore(projectId: string, tableId: string, id: string): Promise<Field> {
    await this.ensureTableExists(projectId, tableId);
    const field = await this.db.field.findFirst({ where: { id, tableId } });
    if (!field) throw FieldErrors.NOT_FOUND;
    if (!field.deletedAt) throw FieldErrors.NOT_ARCHIVED;

    const restored = await this.db.field.update({
      where: { id },
      data: { deletedAt: null },
    });
    await this.migrationsService?.recordChange({
      projectId,
      operation: 'ALTER_FIELD',
      targetType: 'FIELD',
      targetId: restored.id,
      targetName: restored.name,
      beforeState: field as unknown as Prisma.JsonValue,
      afterState: restored as unknown as Prisma.JsonValue,
    });
    return restored;
  }

  async reorder(projectId: string, tableId: string, input: ReorderFieldsInput): Promise<Field[]> {
    await this.ensureTableExists(projectId, tableId);
    const activeFields = await this.db.field.findMany({
      where: { tableId, deletedAt: null },
      select: { id: true },
    });
    if (activeFields.length !== input.fieldIds.length) {
      throw FieldErrors.INVALID_REORDER_LIST;
    }

    const activeIds = new Set(activeFields.map((field) => field.id));
    const uniqueIds = new Set(input.fieldIds);
    if (
      uniqueIds.size !== input.fieldIds.length ||
      !input.fieldIds.every((id) => activeIds.has(id))
    ) {
      throw FieldErrors.INVALID_REORDER_LIST;
    }

    const updates: Prisma.PrismaPromise<Field>[] = [];
    for (let idx = 0; idx < input.fieldIds.length; idx += 1) {
      updates.push(
        this.db.field.update({
          where: { id: input.fieldIds[idx] },
          data: { order: `TMP_${idx + 1}` },
        }),
      );
    }
    for (let idx = 0; idx < input.fieldIds.length; idx += 1) {
      updates.push(
        this.db.field.update({
          where: { id: input.fieldIds[idx] },
          data: { order: toFieldOrder(idx + 1) },
        }),
      );
    }

    await this.db.$transaction(updates);

    return this.db.field.findMany({
      where: { tableId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  async bulkUpdate(
    projectId: string,
    tableId: string,
    input: BulkUpdateFieldsInput,
  ): Promise<{ updatedCount: number }> {
    await this.ensureTableExists(projectId, tableId);

    const uniqueIds = Array.from(new Set(input.fieldIds));
    const data = buildUpdateData(input.changes);
    const keys = Object.keys(data);
    if (uniqueIds.length === 0 || keys.length === 0) throw FieldErrors.INVALID_BULK_LIST;

    const result = await this.db.field.updateMany({
      where: { tableId, id: { in: uniqueIds }, deletedAt: null },
      data,
    });

    if (result.count === 0) throw FieldErrors.INVALID_BULK_LIST;

    return { updatedCount: result.count };
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw ProjectErrors.NOT_FOUND;
  }

  private async ensureTableExists(projectId: string, tableId: string): Promise<TableContext> {
    await this.ensureProjectExists(projectId);
    const table = await this.db.table.findFirst({
      where: { id: tableId, projectId, deletedAt: null },
      select: { id: true, prefix: true },
    });
    if (!table) throw FieldErrors.NOT_FOUND;
    return table;
  }

  private ensureFieldNameMatchesTable(name: string, tablePrefix: string): void {
    const result = validateFieldName(name, tablePrefix);
    if (!result.valid) throw FieldErrors.INVALID_NAME;
  }

  private async ensureFieldNameAvailable(
    tableId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.db.field.findUnique({
      where: { tableId_name: { tableId, name } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) throw FieldErrors.NAME_IN_USE;
  }

  private async ensureFieldOrderAvailable(
    tableId: string,
    order: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.db.field.findUnique({
      where: { tableId_order: { tableId, order } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) throw FieldErrors.ORDER_IN_USE;
  }

  private async generateNextOrder(tableId: string): Promise<string> {
    const lastField = await this.db.field.findFirst({
      where: { tableId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    if (!lastField) return '01';

    const numericOrder = Number.parseInt(lastField.order, 10);
    if (Number.isNaN(numericOrder)) return '01';
    return toFieldOrder(numericOrder + 1);
  }
}

function buildListWhere(tableId: string, input: ListFieldsInput): Prisma.FieldWhereInput {
  const where: Prisma.FieldWhereInput = { tableId };
  if (!input.includeArchived) where.deletedAt = null;
  const search = input.search?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { titlePt: { contains: search, mode: 'insensitive' } },
      { descPt: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value < 1) return fallback;
  return value;
}

function toFieldOrder(value: number): string {
  return String(value).padStart(2, '0');
}

function buildUpdateData(input: UpdateFieldInput): Prisma.FieldUpdateInput {
  const data: Prisma.FieldUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.order !== undefined) data.order = input.order;
  if (input.type !== undefined) data.type = input.type;
  if (input.size !== undefined) data.size = input.size;
  if (input.decimals !== undefined) data.decimals = input.decimals;
  if (input.titlePt !== undefined) data.titlePt = input.titlePt;
  if (input.titleEs !== undefined) data.titleEs = input.titleEs ?? null;
  if (input.titleEn !== undefined) data.titleEn = input.titleEn ?? null;
  if (input.descPt !== undefined) data.descPt = input.descPt;
  if (input.descEs !== undefined) data.descEs = input.descEs ?? null;
  if (input.descEn !== undefined) data.descEn = input.descEn ?? null;
  if (input.picture !== undefined) data.picture = input.picture ?? null;
  if (input.pictureVar !== undefined) data.pictureVar = input.pictureVar ?? null;
  if (input.pictureBrowse !== undefined) data.pictureBrowse = input.pictureBrowse ?? null;
  if (input.validation !== undefined) data.validation = input.validation ?? null;
  if (input.userValidation !== undefined) data.userValidation = input.userValidation ?? null;
  if (input.defaultRel !== undefined) data.defaultRel = input.defaultRel ?? null;
  if (input.whenExpr !== undefined) data.whenExpr = input.whenExpr ?? null;
  if (input.initBrowse !== undefined) data.initBrowse = input.initBrowse ?? null;
  if (input.comboPt !== undefined) data.comboPt = input.comboPt ?? null;
  if (input.comboEs !== undefined) data.comboEs = input.comboEs ?? null;
  if (input.comboEn !== undefined) data.comboEn = input.comboEn ?? null;
  if (input.searchKey !== undefined) data.searchKey = input.searchKey ?? null;
  if (input.visualMode !== undefined) data.visualMode = input.visualMode;
  if (input.contextMode !== undefined) data.contextMode = input.contextMode;
  if (input.owner !== undefined) data.owner = input.owner;
  if (input.required !== undefined) data.required = input.required ?? null;
  if (input.showBrowse !== undefined) data.showBrowse = input.showBrowse;
  if (input.hasCheck !== undefined) data.hasCheck = input.hasCheck;
  if (input.hasTrigger !== undefined) data.hasTrigger = input.hasTrigger;
  if (input.level !== undefined) data.level = input.level;
  if (input.pyme !== undefined) data.pyme = input.pyme;
  if (input.serverIndex !== undefined) data.serverIndex = input.serverIndex;
  if (input.fieldIndex !== undefined) data.fieldIndex = input.fieldIndex;
  if (input.spelling !== undefined) data.spelling = input.spelling;
  if (input.modal !== undefined) data.modal = input.modal;
  if (input.positionLogix !== undefined) data.positionLogix = input.positionLogix;
  if (input.usadoFlags !== undefined) data.usadoFlags = input.usadoFlags as Prisma.InputJsonValue;
  if (input.modulesFlags !== undefined)
    data.modulesFlags = input.modulesFlags as Prisma.InputJsonValue;
  if (input.sqlCondition !== undefined) data.sqlCondition = input.sqlCondition ?? null;
  if (input.sqlCheck !== undefined) data.sqlCheck = input.sqlCheck ?? null;
  if (input.groupSxg !== undefined) data.groupSxg = input.groupSxg ?? null;
  if (input.folder !== undefined) data.folder = input.folder ?? null;
  if (input.screen !== undefined) data.screen = input.screen ?? null;
  if (input.grouping !== undefined) data.grouping = input.grouping ?? null;
  if (input.reserved !== undefined) data.reserved = input.reserved ?? null;
  if (input.notes !== undefined) data.notes = input.notes ?? null;

  return data;
}
