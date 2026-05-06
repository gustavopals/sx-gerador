import {
  buildMigration,
  type MigrationInput,
  type MigrationItemInput,
} from '@sxgerador/advpl-builder';
import {
  Prisma,
  type Migration,
  type MigrationOperation,
  type MigrationStatus,
  type PrismaClient,
} from '../../generated/prisma';
import { ProjectErrors } from '../projects/projects.errors';
import { MigrationErrors } from './migrations.errors';

interface RecordChangeInput {
  projectId: string;
  operation: MigrationOperation;
  targetType: 'TABLE' | 'FIELD' | 'INDEX';
  targetId?: string | null;
  targetName: string;
  beforeState?: Prisma.JsonValue | null;
  afterState?: Prisma.JsonValue | null;
}

export interface MigrationWithCode extends Migration {
  advplCode: string;
}

export interface MigrationListItem {
  id: string;
  sequence: number;
  name: string;
  createdAt: Date;
  generatedAt: Date | null;
  createdBy: string;
  itemsCount: number;
  items: Array<{
    id: string;
    operation: MigrationOperation;
    targetType: string;
    targetName: string;
    createdAt: Date;
  }>;
}

export class MigrationsService {
  constructor(private readonly db: PrismaClient) {}

  async getCurrentDraft(projectId: string, createdBy: string = 'system'): Promise<Migration> {
    await this.ensureProjectExists(projectId);

    const existingDraft = await this.db.migration.findFirst({
      where: { projectId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });
    if (existingDraft) return existingDraft;

    const maxSequence = await this.db.migration.aggregate({
      where: { projectId },
      _max: { sequence: true },
    });

    const nextSequence = (maxSequence._max.sequence ?? 0) + 1;
    return this.db.migration.create({
      data: {
        projectId,
        sequence: nextSequence,
        name: `Draft ${String(nextSequence).padStart(3, '0')}`,
        status: 'DRAFT',
        createdBy,
      },
    });
  }

  async recordChange(input: RecordChangeInput, createdBy: string = 'system'): Promise<void> {
    const draft = await this.getCurrentDraft(input.projectId, createdBy);
    await this.db.migrationItem.create({
      data: {
        migrationId: draft.id,
        operation: input.operation,
        beforeState: normalizeJson(input.beforeState),
        afterState: normalizeJson(input.afterState),
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        targetName: input.targetName,
      },
    });
  }

  async generateMigration(
    projectId: string,
    name: string,
    createdBy: string = 'system',
  ): Promise<Migration> {
    await this.ensureProjectExists(projectId);

    const draft = await this.db.migration.findFirst({
      where: { projectId, status: 'DRAFT' },
      include: { items: true, project: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!draft) throw MigrationErrors.DRAFT_NOT_FOUND;
    if (draft.items.length === 0) throw MigrationErrors.EMPTY_DRAFT;

    const author = await this.db.user.findUnique({
      where: { id: createdBy },
      select: { name: true, email: true },
    });

    const buildInput: MigrationInput = {
      id: draft.id,
      sequence: draft.sequence,
      name,
      project: {
        name: draft.project.name,
        slug: draft.project.slug,
      },
      author: {
        name: author?.name ?? 'Sistema SXGerador',
        email: author?.email ?? 'noreply@sxgerador.local',
      },
      items: draft.items.map(mapItemToBuilderInput),
    };

    const advplCode = buildMigration(buildInput);

    return this.db.migration.update({
      where: { id: draft.id },
      data: {
        name,
        status: 'GENERATED' satisfies MigrationStatus,
        advplCode,
        generatedAt: new Date(),
        createdBy,
      },
    });
  }

  async getDraftWithItems(projectId: string): Promise<{
    draft: Migration;
    items: Array<{
      id: string;
      operation: MigrationOperation;
      targetType: string;
      targetName: string;
      createdAt: Date;
    }>;
  }> {
    await this.ensureProjectExists(projectId);

    const draft = await this.db.migration.findFirst({
      where: { projectId, status: 'DRAFT' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!draft) throw MigrationErrors.DRAFT_NOT_FOUND;

    return {
      draft,
      items: draft.items.map((item) => ({
        id: item.id,
        operation: item.operation,
        targetType: item.targetType,
        targetName: item.targetName,
        createdAt: item.createdAt,
      })),
    };
  }

  async getById(projectId: string, migrationId: string): Promise<Migration> {
    await this.ensureProjectExists(projectId);
    const migration = await this.db.migration.findFirst({
      where: { id: migrationId, projectId },
    });
    if (!migration) throw MigrationErrors.NOT_FOUND;
    return migration;
  }

  async getWithGeneratedCode(projectId: string, migrationId: string): Promise<MigrationWithCode> {
    const migration = await this.getById(projectId, migrationId);
    if (!migration.advplCode) throw MigrationErrors.CODE_NOT_GENERATED;
    return migration as MigrationWithCode;
  }

  async listGenerated(projectId: string): Promise<MigrationListItem[]> {
    await this.ensureProjectExists(projectId);
    const migrations = await this.db.migration.findMany({
      where: { projectId, status: 'GENERATED' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ sequence: 'desc' }, { createdAt: 'desc' }],
    });

    return migrations.map((migration) => ({
      id: migration.id,
      sequence: migration.sequence,
      name: migration.name,
      createdAt: migration.createdAt,
      generatedAt: migration.generatedAt,
      createdBy: migration.createdBy,
      itemsCount: migration.items.length,
      items: migration.items.map((item) => ({
        id: item.id,
        operation: item.operation,
        targetType: item.targetType,
        targetName: item.targetName,
        createdAt: item.createdAt,
      })),
    }));
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw ProjectErrors.NOT_FOUND;
  }
}

function mapItemToBuilderInput(item: {
  id: string;
  operation: MigrationOperation;
  targetType: string;
  targetName: string;
  beforeState: Prisma.JsonValue | null;
  afterState: Prisma.JsonValue | null;
}): MigrationItemInput {
  return {
    id: item.id,
    operation: item.operation as MigrationItemInput['operation'],
    targetType: item.targetType as MigrationItemInput['targetType'],
    targetName: item.targetName,
    beforeState: toRecord(item.beforeState),
    afterState: toRecord(item.afterState),
  };
}

function toRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeJson(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}
