import type { CreateTableData, UpdateTableInput } from '@sxgerador/shared-types';
import type { Prisma, PrismaClient, Table } from '../../generated/prisma';
import { logAudit } from '../audit';
import { ProjectErrors } from '../projects/projects.errors';
import { TableErrors } from './tables.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ListTablesInput {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface PaginatedTables {
  tables: Table[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class TablesService {
  constructor(private readonly db: PrismaClient) {}

  async list(projectId: string, input: ListTablesInput = {}): Promise<PaginatedTables> {
    await this.ensureProjectExists(projectId);

    const page = normalizePositiveInt(input.page, DEFAULT_PAGE);
    const pageSize = Math.min(
      normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const where = buildListWhere(projectId, input);
    const [tables, total] = await this.db.$transaction([
      this.db.table.findMany({
        where,
        orderBy: { prefix: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.table.count({ where }),
    ]);

    return {
      tables,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async get(projectId: string, id: string): Promise<Table> {
    const table = await this.db.table.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!table) throw TableErrors.NOT_FOUND;
    return table;
  }

  async create(projectId: string, input: CreateTableData, actorUserId?: string): Promise<Table> {
    await this.ensureProjectExists(projectId);
    await this.ensurePrefixAvailable(projectId, input.prefix);

    const table = await this.db.table.create({
      data: { ...input, projectId },
    });

    await logAudit(this.db, 'tables.create', actorUserId ?? null, {
      projectId,
      tableId: table.id,
    });
    return table;
  }

  async update(
    projectId: string,
    id: string,
    input: UpdateTableInput,
    actorUserId?: string,
  ): Promise<Table> {
    await this.get(projectId, id);

    const table = await this.db.table.update({
      where: { id },
      data: buildUpdateData(input),
    });

    await logAudit(this.db, 'tables.update', actorUserId ?? null, {
      projectId,
      tableId: id,
    });
    return table;
  }

  async delete(projectId: string, id: string, actorUserId?: string): Promise<Table> {
    const table = await this.db.table.findFirst({ where: { id, projectId } });
    if (!table) throw TableErrors.NOT_FOUND;
    if (table.deletedAt) throw TableErrors.ALREADY_ARCHIVED;

    const archived = await this.db.table.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(this.db, 'tables.delete', actorUserId ?? null, {
      projectId,
      tableId: id,
    });
    return archived;
  }

  async restore(projectId: string, id: string, actorUserId?: string): Promise<Table> {
    const table = await this.db.table.findFirst({ where: { id, projectId } });
    if (!table) throw TableErrors.NOT_FOUND;
    if (!table.deletedAt) throw TableErrors.NOT_ARCHIVED;

    const restored = await this.db.table.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logAudit(this.db, 'tables.restore', actorUserId ?? null, {
      projectId,
      tableId: id,
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

  private async ensurePrefixAvailable(projectId: string, prefix: string): Promise<void> {
    const existing = await this.db.table.findUnique({
      where: { projectId_prefix: { projectId, prefix } },
    });
    if (existing) throw TableErrors.PREFIX_IN_USE;
  }
}

function buildListWhere(projectId: string, input: ListTablesInput): Prisma.TableWhereInput {
  const where: Prisma.TableWhereInput = { projectId };
  if (!input.includeArchived) where.deletedAt = null;

  const search = input.search?.trim();
  if (search) {
    where.OR = [
      { prefix: { contains: search, mode: 'insensitive' } },
      { namePt: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value < 1) return fallback;
  return value;
}

function buildUpdateData(input: UpdateTableInput): Prisma.TableUpdateInput {
  const data: Prisma.TableUpdateInput = {};
  if (input.namePt !== undefined) data.namePt = input.namePt;
  if (input.nameEs !== undefined) data.nameEs = input.nameEs ?? null;
  if (input.nameEn !== undefined) data.nameEn = input.nameEn ?? null;
  if (input.routine !== undefined) data.routine = input.routine ?? null;
  if (input.modeCompany !== undefined) data.modeCompany = input.modeCompany;
  if (input.modeUnit !== undefined) data.modeUnit = input.modeUnit;
  if (input.modeBranch !== undefined) data.modeBranch = input.modeBranch;
  if (input.ttsEnabled !== undefined) data.ttsEnabled = input.ttsEnabled;
  if (input.uniqueKey !== undefined) data.uniqueKey = input.uniqueKey ?? null;
  if (input.pyme !== undefined) data.pyme = input.pyme;
  if (input.modules !== undefined) data.modules = input.modules;
  if (input.hasClob !== undefined) data.hasClob = input.hasClob;
  if (input.autoIncRec !== undefined) data.autoIncRec = input.autoIncRec;
  if (input.tamFil !== undefined) data.tamFil = input.tamFil;
  if (input.tamUn !== undefined) data.tamUn = input.tamUn;
  if (input.tamEmp !== undefined) data.tamEmp = input.tamEmp;
  if (input.notes !== undefined) data.notes = input.notes ?? null;
  return data;
}
