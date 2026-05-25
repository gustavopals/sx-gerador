import type { HistoryQuery } from '@sxgerador/shared-types';
import type { MigrationOperation, Prisma, PrismaClient } from '../../generated/prisma';
import { assertProjectPermission } from '../permissions';
import { ProjectErrors } from '../projects/projects.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface HistoryEntry {
  id: string;
  migrationId: string;
  migrationSequence: number;
  migrationName: string;
  migrationGeneratedAt: string | null;
  operation: MigrationOperation;
  targetType: string;
  targetName: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
}

export interface HistoryListResult {
  entries: HistoryEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class HistoryService {
  constructor(private readonly db: PrismaClient) {}

  async listProjectHistory(
    projectId: string,
    query: HistoryQuery,
    actorUserId?: string,
  ): Promise<HistoryListResult> {
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectId);

    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw ProjectErrors.NOT_FOUND;

    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const where: Prisma.MigrationItemWhereInput = {
      migration: {
        projectId,
        status: 'GENERATED',
        ...(query.authorId ? { createdBy: query.authorId } : {}),
        ...(query.from || query.to
          ? {
              generatedAt: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {}),
      },
      ...(query.operation ? { operation: query.operation as MigrationOperation } : {}),
      ...(query.tablePrefix
        ? {
            OR: [
              { targetType: 'TABLE', targetName: query.tablePrefix },
              { targetName: { startsWith: `${query.tablePrefix}_` } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.db.migrationItem.count({ where }),
      this.db.migrationItem.findMany({
        where,
        include: {
          migration: {
            select: {
              id: true,
              sequence: true,
              name: true,
              generatedAt: true,
              createdBy: true,
            },
          },
        },
        orderBy: [{ migration: { sequence: 'desc' } }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    const authorIds = [...new Set(items.map((i) => i.migration.createdBy))];
    const authors = await this.db.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, email: true },
    });
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    const entries: HistoryEntry[] = items.map((item) => {
      const author = authorMap.get(item.migration.createdBy);
      return {
        id: item.id,
        migrationId: item.migration.id,
        migrationSequence: item.migration.sequence,
        migrationName: item.migration.name,
        migrationGeneratedAt: item.migration.generatedAt?.toISOString() ?? null,
        operation: item.operation,
        targetType: item.targetType,
        targetName: item.targetName,
        createdAt: item.createdAt.toISOString(),
        authorId: item.migration.createdBy,
        authorName: author?.name ?? null,
        authorEmail: author?.email ?? null,
      };
    });

    return {
      entries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }
}
