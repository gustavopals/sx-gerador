import {
  validateFieldName,
  validateIndexKeyFields,
  validatePrefix,
} from '@sxgerador/dictionary-validator';
import {
  TemplateContentSchema,
  type ApplyTemplateBody,
  type CreateTemplateFromTableInput,
  type ListTemplatesQuery,
  type TemplateContent,
} from '@sxgerador/shared-types';
import {
  Prisma,
  type Field,
  type Index,
  type PrismaClient,
  type Table,
  type Template,
} from '../../generated/prisma';
import { logAudit } from '../audit';
import type { MigrationsService } from '../migrations/migrations.service';
import { assertProjectPermission } from '../permissions';
import { TableErrors } from '../tables/tables.errors';
import { buildTemplateContent, remapTemplatePrefix } from './template-snapshot';
import { TemplateErrors } from './templates.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const TEMPLATE_CACHE_TTL_MS = 60_000;

export interface TemplateSummary extends Template {
  authorName: string | null;
}

export interface PaginatedTemplates {
  templates: TemplateSummary[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ApplyTemplatePreviewResult {
  valid: boolean;
  errors: string[];
  targetPrefix: string | null;
  summary: {
    tableName: string;
    fieldsCount: number;
    indexesCount: number;
    action: 'create';
  } | null;
}

export interface ApplyTemplateResult {
  success: boolean;
  errors: string[];
  tableId?: string;
  prefix?: string;
}

export class TemplatesService {
  private readonly listCache = new Map<string, { expiresAt: number; data: PaginatedTemplates }>();
  private readonly itemCache = new Map<string, { expiresAt: number; data: TemplateSummary }>();

  constructor(
    private readonly db: PrismaClient,
    private readonly migrationsService?: MigrationsService,
  ) {}

  async list(query: ListTemplatesQuery = {}): Promise<PaginatedTemplates> {
    const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const cacheKey = JSON.stringify({
      page,
      pageSize,
      category: query.category ?? '',
      officialOnly: query.officialOnly === true,
      search: query.search?.trim() ?? '',
    });
    const cached = this.listCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const where: Prisma.TemplateWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.officialOnly) where.isOfficial = true;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { sourceTablePrefix: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.db.$transaction([
      this.db.template.findMany({
        where,
        orderBy: [{ isOfficial: 'desc' }, { downloads: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { name: true } } },
      }),
      this.db.template.count({ where }),
    ]);

    const result = {
      templates: rows.map((row) => ({
        ...stripAuthor(row),
        authorName: row.author?.name ?? null,
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
    this.listCache.set(cacheKey, { expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS, data: result });
    return result;
  }

  async get(id: string): Promise<TemplateSummary> {
    const cached = this.itemCache.get(id);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const row = await this.db.template.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
    if (!row) throw TemplateErrors.NOT_FOUND;
    const result = { ...stripAuthor(row), authorName: row.author?.name ?? null };
    this.itemCache.set(id, { expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS, data: result });
    return result;
  }

  async createFromTable(
    input: CreateTemplateFromTableInput,
    authorUserId: string,
  ): Promise<TemplateSummary> {
    await assertProjectPermission(this.db, authorUserId, 'dictionary:write', input.projectId);

    const table = await this.db.table.findFirst({
      where: { id: input.tableId, projectId: input.projectId, deletedAt: null },
      include: {
        fields: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        indexes: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
    });
    if (!table) throw TableErrors.NOT_FOUND;

    const content = buildTemplateContent(table, table.fields, table.indexes);

    const created = await this.db.template.create({
      data: {
        authorId: authorUserId,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        content: content as unknown as Prisma.InputJsonValue,
        sourceTablePrefix: table.prefix,
        isOfficial: false,
      },
      include: { author: { select: { name: true } } },
    });

    await logAudit(this.db, 'templates.publish', authorUserId, {
      templateId: created.id,
      tableId: input.tableId,
      prefix: table.prefix,
    });

    this.invalidateCache();
    return { ...stripAuthor(created), authorName: created.author?.name ?? null };
  }

  async previewApply(
    templateId: string,
    body: ApplyTemplateBody,
    actorUserId?: string,
  ): Promise<ApplyTemplatePreviewResult> {
    const template = await this.get(templateId);
    const content = this.parseContent(template.content);
    const resolved = await this.resolveContentForProject(
      content,
      body.projectId,
      body.prefixOverride,
      actorUserId,
    );
    if (!resolved.valid || !resolved.content) {
      return {
        valid: false,
        errors: resolved.errors,
        targetPrefix: resolved.targetPrefix,
        summary: null,
      };
    }

    const domainErrors = validateTemplateContent(resolved.content);
    if (domainErrors.length > 0) {
      return {
        valid: false,
        errors: domainErrors,
        targetPrefix: resolved.targetPrefix,
        summary: null,
      };
    }

    return {
      valid: true,
      errors: [],
      targetPrefix: resolved.targetPrefix,
      summary: {
        tableName: resolved.content.table.namePt,
        fieldsCount: resolved.content.fields.length,
        indexesCount: resolved.content.indexes.length,
        action: 'create',
      },
    };
  }

  async apply(
    templateId: string,
    body: ApplyTemplateBody,
    actorUserId?: string,
  ): Promise<ApplyTemplateResult> {
    const preview = await this.previewApply(templateId, body, actorUserId);
    if (!preview.valid || !preview.targetPrefix) {
      return { success: false, errors: preview.errors };
    }

    const template = await this.get(templateId);
    const content = this.parseContent(template.content);
    const resolved = await this.resolveContentForProject(
      content,
      body.projectId,
      body.prefixOverride,
      actorUserId,
    );
    if (!resolved.valid || !resolved.content) {
      return { success: false, errors: resolved.errors };
    }

    try {
      const tableId = await this.db.$transaction(async (tx) => {
        const table = await tx.table.create({
          data: {
            projectId: body.projectId,
            ...resolved.content!.table,
          },
        });

        const createdFields: Field[] = [];
        for (const f of resolved.content!.fields) {
          const field = await tx.field.create({
            data: {
              ...f,
              usadoFlags: f.usadoFlags as Prisma.InputJsonValue,
              modulesFlags: f.modulesFlags as Prisma.InputJsonValue,
              tableId: table.id,
            },
          });
          createdFields.push(field);
        }

        const createdIndexes: Index[] = [];
        for (const ix of resolved.content!.indexes) {
          const index = await tx.index.create({
            data: { ...ix, tableId: table.id },
          });
          createdIndexes.push(index);
        }

        await tx.template.update({
          where: { id: templateId },
          data: { downloads: { increment: 1 } },
        });

        await this.recordTemplateApplyChanges(tx, {
          projectId: body.projectId,
          actorUserId,
          table,
          fields: createdFields,
          indexes: createdIndexes,
        });

        return table.id;
      });

      await logAudit(this.db, 'templates.apply', actorUserId ?? null, {
        templateId,
        projectId: body.projectId,
        prefix: preview.targetPrefix,
        tableId,
      });

      this.invalidateCache();
      return {
        success: true,
        errors: [],
        tableId,
        prefix: preview.targetPrefix,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        errors: [`Falha ao aplicar template (transação revertida): ${message}`],
      };
    }
  }

  private parseContent(raw: unknown): TemplateContent {
    const parsed = TemplateContentSchema.safeParse(raw);
    if (!parsed.success) throw TemplateErrors.INVALID_CONTENT;
    return parsed.data;
  }

  private invalidateCache(): void {
    this.listCache.clear();
    this.itemCache.clear();
  }

  private async recordTemplateApplyChanges(
    tx: Prisma.TransactionClient,
    input: {
      projectId: string;
      actorUserId?: string;
      table: Table;
      fields: Field[];
      indexes: Index[];
    },
  ): Promise<void> {
    if (!this.migrationsService) return;

    const draft = await this.getOrCreateDraftInTransaction(
      tx,
      input.projectId,
      input.actorUserId ?? 'system',
    );

    await tx.migrationItem.create({
      data: {
        migrationId: draft.id,
        operation: 'CREATE_TABLE',
        targetType: 'TABLE',
        targetId: input.table.id,
        targetName: input.table.prefix,
        beforeState: Prisma.JsonNull,
        afterState: input.table as unknown as Prisma.InputJsonValue,
      },
    });

    for (const field of input.fields) {
      await tx.migrationItem.create({
        data: {
          migrationId: draft.id,
          operation: 'CREATE_FIELD',
          targetType: 'FIELD',
          targetId: field.id,
          targetName: field.name,
          beforeState: Prisma.JsonNull,
          afterState: field as unknown as Prisma.InputJsonValue,
        },
      });
    }

    for (const index of input.indexes) {
      await tx.migrationItem.create({
        data: {
          migrationId: draft.id,
          operation: 'CREATE_INDEX',
          targetType: 'INDEX',
          targetId: index.id,
          targetName: index.key,
          beforeState: Prisma.JsonNull,
          afterState: index as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async getOrCreateDraftInTransaction(
    tx: Prisma.TransactionClient,
    projectId: string,
    createdBy: string,
  ): Promise<{ id: string }> {
    const existingDraft = await tx.migration.findFirst({
      where: { projectId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existingDraft) return existingDraft;

    const maxSequence = await tx.migration.aggregate({
      where: { projectId },
      _max: { sequence: true },
    });

    const nextSequence = (maxSequence._max.sequence ?? 0) + 1;
    return tx.migration.create({
      data: {
        projectId,
        sequence: nextSequence,
        name: `Draft ${String(nextSequence).padStart(3, '0')}`,
        status: 'DRAFT',
        createdBy,
      },
      select: { id: true },
    });
  }

  private async resolveContentForProject(
    content: TemplateContent,
    projectId: string,
    prefixOverride: string | undefined,
    actorUserId?: string,
  ): Promise<{
    valid: boolean;
    errors: string[];
    content: TemplateContent | null;
    targetPrefix: string | null;
  }> {
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);

    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      return {
        valid: false,
        errors: ['Projeto não encontrado ou arquivado.'],
        content: null,
        targetPrefix: null,
      };
    }

    const targetPrefix = prefixOverride?.toUpperCase() ?? content.table.prefix;
    let mapped = content;
    if (prefixOverride) {
      mapped = remapTemplatePrefix(content, targetPrefix);
    }

    const existing = await this.db.table.findUnique({
      where: { projectId_prefix: { projectId, prefix: targetPrefix } },
    });
    if (existing) {
      return {
        valid: false,
        errors: [
          `O prefixo ${targetPrefix} já está em uso neste projeto. Escolha outro em "prefixOverride".`,
        ],
        content: null,
        targetPrefix,
      };
    }

    const pv = validatePrefix(targetPrefix);
    if (!pv.valid) {
      return { valid: false, errors: pv.errors, content: null, targetPrefix };
    }

    return { valid: true, errors: [], content: mapped, targetPrefix };
  }
}

function validateTemplateContent(content: TemplateContent): string[] {
  const errors: string[] = [];
  const prefix = content.table.prefix;
  const fieldNames = content.fields.map((f) => f.name);

  const primary = content.indexes.filter((i) => i.order.trim() === '1');
  if (primary.length !== 1) {
    errors.push('O template deve ter exatamente um índice com ordem "1".');
  }

  for (const f of content.fields) {
    const fn = validateFieldName(f.name, prefix);
    if (!fn.valid) errors.push(...fn.errors.map((e) => `[${f.name}] ${e}`));
  }

  for (const ix of content.indexes) {
    const kv = validateIndexKeyFields(ix.key, fieldNames);
    if (!kv.valid) errors.push(...kv.errors.map((e) => `Índice ${ix.order}: ${e}`));
  }

  return errors;
}

function stripAuthor<T extends { author?: { name: string } | null }>(row: T): Omit<T, 'author'> {
  const { author: _author, ...rest } = row;
  return rest;
}
