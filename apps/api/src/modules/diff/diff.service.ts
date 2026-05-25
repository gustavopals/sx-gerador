import {
  diff,
  diffMigrationItems,
  snapshotFromExportTables,
  type DiffResult,
  type MigrationItemsDiffResult,
} from '@sxgerador/dictionary-diff';
import type { PrismaClient } from '../../generated/prisma';
import { MigrationErrors } from '../migrations/migrations.errors';
import { assertProjectPermission } from '../permissions';
import { ProjectErrors } from '../projects/projects.errors';
import { PROJECT_EXPORT_INCLUDE } from '../projects/projects.service';

export class DiffService {
  constructor(private readonly db: PrismaClient) {}

  async compareProjects(
    projectIdA: string,
    projectIdB: string,
    actorUserId?: string,
  ): Promise<{
    projectA: { id: string; name: string; slug: string };
    projectB: { id: string; name: string; slug: string };
    diff: DiffResult;
  }> {
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectIdA);
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectIdB);

    const [a, b] = await Promise.all([
      this.loadProjectSnapshot(projectIdA),
      this.loadProjectSnapshot(projectIdB),
    ]);

    return {
      projectA: { id: a.id, name: a.name, slug: a.slug },
      projectB: { id: b.id, name: b.name, slug: b.slug },
      diff: diff(a.snapshot, b.snapshot),
    };
  }

  async compareMigrations(
    projectId: string,
    migrationIdA: string,
    migrationIdB: string,
    actorUserId?: string,
  ): Promise<{
    migrationA: { id: string; name: string; sequence: number };
    migrationB: { id: string; name: string; sequence: number };
    dictionaryDiff: DiffResult;
    itemsDiff: MigrationItemsDiffResult;
  }> {
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectId);

    const [migA, migB] = await Promise.all([
      this.loadMigrationWithItems(projectId, migrationIdA),
      this.loadMigrationWithItems(projectId, migrationIdB),
    ]);

    const snapshotA = await this.reconstructSnapshotAtMigration(projectId, migA.sequence);
    const snapshotB = await this.reconstructSnapshotAtMigration(projectId, migB.sequence);

    const itemsA = migA.items.map(mapMigrationItem);
    const itemsB = migB.items.map(mapMigrationItem);

    return {
      migrationA: { id: migA.id, name: migA.name, sequence: migA.sequence },
      migrationB: { id: migB.id, name: migB.name, sequence: migB.sequence },
      dictionaryDiff: diff(snapshotA, snapshotB),
      itemsDiff: diffMigrationItems(itemsA, itemsB),
    };
  }

  private async loadProjectSnapshot(projectId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    snapshot: ReturnType<typeof snapshotFromExportTables>;
  }> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: PROJECT_EXPORT_INCLUDE,
    });
    if (!project) throw ProjectErrors.NOT_FOUND;

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      snapshot: snapshotFromExportTables(project.tables),
    };
  }

  private async loadMigrationWithItems(projectId: string, migrationId: string) {
    const migration = await this.db.migration.findFirst({
      where: { id: migrationId, projectId, status: 'GENERATED' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!migration) throw MigrationErrors.NOT_FOUND;
    return migration;
  }

  /** Reconstrói o dicionário acumulando itens de migrations geradas até `maxSequence`. */
  private async reconstructSnapshotAtMigration(
    projectId: string,
    maxSequence: number,
  ): Promise<ReturnType<typeof snapshotFromExportTables>> {
    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: PROJECT_EXPORT_INCLUDE,
    });
    if (!project) throw ProjectErrors.NOT_FOUND;

    const base = snapshotFromExportTables(project.tables);
    const tablesMap = new Map(base.tables.map((t) => [t.prefix, structuredClone(t)]));

    const migrations = await this.db.migration.findMany({
      where: { projectId, status: 'GENERATED', sequence: { lte: maxSequence } },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: { sequence: 'asc' },
    });

    for (const mig of migrations) {
      for (const item of mig.items) {
        applyMigrationItemToSnapshot(tablesMap, item);
      }
    }

    return { tables: [...tablesMap.values()].sort((a, b) => a.prefix.localeCompare(b.prefix)) };
  }
}

function mapMigrationItem(item: {
  id: string;
  operation: string;
  targetType: string;
  targetName: string;
  beforeState: unknown;
  afterState: unknown;
}) {
  return {
    id: item.id,
    operation: item.operation,
    targetType: item.targetType,
    targetName: item.targetName,
    beforeState: toRecord(item.beforeState),
    afterState: toRecord(item.afterState),
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function applyMigrationItemToSnapshot(
  tablesMap: Map<string, ReturnType<typeof snapshotFromExportTables>['tables'][number]>,
  item: {
    operation: string;
    targetType: string;
    targetName: string;
    afterState: unknown;
    beforeState: unknown;
  },
): void {
  const state = toRecord(item.afterState) ?? toRecord(item.beforeState);
  if (!state) return;

  if (item.targetType === 'TABLE') {
    const prefix = String(state['prefix'] ?? item.targetName);
    if (item.operation === 'DROP_TABLE') {
      tablesMap.delete(prefix);
      return;
    }
    if (item.operation === 'CREATE_TABLE' || item.operation === 'ALTER_TABLE') {
      const existing = tablesMap.get(prefix) ?? {
        prefix,
        table: {},
        fields: {},
        indexes: {},
      };
      existing.table = { ...existing.table, ...pickTableScalars(state) };
      tablesMap.set(prefix, existing);
    }
    return;
  }

  const tablePrefix = item.targetName.split('_')[0] ?? item.targetName.slice(0, 3);
  const table = tablesMap.get(tablePrefix);
  if (!table) return;

  if (item.targetType === 'FIELD') {
    const name = String(state['name'] ?? item.targetName);
    if (item.operation === 'DROP_FIELD') {
      delete table.fields[name];
      return;
    }
    table.fields[name] = { ...table.fields[name], ...state };
  }

  if (item.targetType === 'INDEX') {
    const order = String(state['order'] ?? '1');
    if (item.operation === 'DROP_INDEX') {
      delete table.indexes[order];
      return;
    }
    table.indexes[order] = { ...table.indexes[order], ...state };
  }
}

function pickTableScalars(row: Record<string, unknown>): Record<string, unknown> {
  const keys = [
    'fileName',
    'namePt',
    'nameEs',
    'nameEn',
    'routine',
    'modeCompany',
    'modeUnit',
    'modeBranch',
    'ttsEnabled',
    'uniqueKey',
    'pyme',
    'modules',
    'hasClob',
    'autoIncRec',
    'tamFil',
    'tamUn',
    'tamEmp',
    'notes',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = row[k] ?? null;
  return out;
}
