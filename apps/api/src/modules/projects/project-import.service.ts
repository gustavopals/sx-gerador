import {
  validateFieldName,
  validateIndexKeyFields,
  validatePrefix,
} from '@sxgerador/dictionary-validator';
import { ProjectImportDocumentSchema, type ProjectImportDocument } from '@sxgerador/shared-types';
import type { Prisma, PrismaClient } from '../../generated/prisma';
import { logAudit } from '../audit';
import { assertProjectPermission } from '../permissions';
import { ProjectErrors } from './projects.errors';
import { PROJECT_EXPORT_INCLUDE, type ProjectExportSnapshot } from './projects.service';

export interface ImportPreviewTableDetail {
  prefix: string;
  action: 'create' | 'update';
  fields: { create: string[]; update: string[]; delete: string[] };
  indexes: { create: string[]; update: string[]; delete: string[] };
}

export interface ImportPreviewResult {
  valid: boolean;
  errors: string[];
  summary: {
    tablesCreated: number;
    tablesUpdated: number;
    tablesDeleted: number;
    fieldsCreated: number;
    fieldsUpdated: number;
    fieldsDeleted: number;
    indexesCreated: number;
    indexesUpdated: number;
    indexesDeleted: number;
  } | null;
  tables: ImportPreviewTableDetail[] | null;
}

export interface ImportApplyResult {
  success: boolean;
  errors: string[];
  summary?: ImportPreviewResult['summary'];
}

type Tx = Prisma.TransactionClient;

export class ProjectImportService {
  constructor(private readonly db: PrismaClient) {}

  async preview(
    projectId: string,
    rawDocument: unknown,
    actorUserId?: string,
  ): Promise<ImportPreviewResult> {
    await this.ensureProjectReadable(projectId, actorUserId);
    const parsed = this.parseAndValidate(projectId, rawDocument);
    if (!parsed.valid) {
      return {
        valid: false,
        errors: parsed.errors,
        summary: null,
        tables: null,
      };
    }

    const current = await this.loadSnapshot(projectId);
    const plan = buildPlan(parsed.document, current, false);
    return {
      valid: true,
      errors: [],
      summary: plan.summary,
      tables: plan.tableDetails,
    };
  }

  async apply(
    projectId: string,
    rawDocument: unknown,
    actorUserId?: string,
    options?: { syncDeletions?: boolean },
  ): Promise<ImportApplyResult> {
    const parsed = this.parseAndValidate(projectId, rawDocument);
    if (!parsed.valid) {
      return { success: false, errors: parsed.errors };
    }

    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);

    const syncDeletions = options?.syncDeletions === true;
    const project = await this.db.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw ProjectErrors.NOT_FOUND;
    await assertProjectPermission(this.db, actorUserId, 'dictionary:write', projectId);

    const current = await this.loadSnapshot(projectId);
    const plan = buildPlan(parsed.document, current, syncDeletions);

    try {
      await this.db.$transaction(
        async (tx) => {
          if (syncDeletions) {
            await applyTableDeletions(tx, projectId, parsed.document);
          }
          for (const t of sortTables(parsed.document.tables)) {
            await upsertTable(tx, projectId, t, syncDeletions);
          }
        },
        { maxWait: 15000, timeout: 120000 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        errors: [`Falha ao aplicar importação (transação revertida): ${message}`],
      };
    }

    await logAudit(this.db, 'projects.import.apply', actorUserId ?? null, {
      projectId,
      tables: parsed.document.tables.length,
      syncDeletions,
    });

    return { success: true, errors: [], summary: plan.summary };
  }

  private async ensureProjectReadable(projectId: string, actorUserId?: string): Promise<void> {
    const project = await this.db.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw ProjectErrors.NOT_FOUND;
    await assertProjectPermission(this.db, actorUserId, 'dictionary:read', projectId);
  }

  private parseAndValidate(
    projectId: string,
    raw: unknown,
  ): { valid: true; document: ProjectImportDocument } | { valid: false; errors: string[] } {
    const zod = ProjectImportDocumentSchema.safeParse(raw);
    if (!zod.success) {
      return {
        valid: false,
        errors: zod.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
      };
    }
    const domain = collectDomainErrors(zod.data, projectId);
    if (domain.length > 0) return { valid: false, errors: domain };
    return { valid: true, document: zod.data };
  }

  private async loadSnapshot(projectId: string): Promise<ProjectExportSnapshot | null> {
    const row = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: PROJECT_EXPORT_INCLUDE,
    });
    return row as unknown as ProjectExportSnapshot | null;
  }
}

function collectDomainErrors(doc: ProjectImportDocument, projectId: string): string[] {
  const errors: string[] = [];
  if (doc.project.id !== projectId) {
    errors.push(
      `O documento refere ao projeto "${doc.project.id}", diferente do projeto destino (${projectId}).`,
    );
  }
  for (const t of doc.tables) {
    const pv = validatePrefix(t.prefix);
    if (!pv.valid) errors.push(...pv.errors.map((e) => `[${t.prefix}] ${e}`));
    const primaryIndexes = t.indexes.filter((i) => i.order.trim() === '1');
    if (primaryIndexes.length !== 1) {
      errors.push(
        `[${t.prefix}] Deve existir exatamente um índice com ordem "1" (encontrado ${primaryIndexes.length}).`,
      );
    }
    const fieldNames = t.fields.map((f) => f.name);
    for (const f of t.fields) {
      const fn = validateFieldName(f.name, t.prefix);
      if (!fn.valid) errors.push(...fn.errors.map((e) => `[${t.prefix}/${f.name}] ${e}`));
    }
    for (const idx of t.indexes) {
      const keyVal = validateIndexKeyFields(idx.key, fieldNames);
      if (!keyVal.valid)
        errors.push(...keyVal.errors.map((e) => `[${t.prefix}] Índice ${idx.order}: ${e}`));
    }
  }
  return errors;
}

interface PlanResult {
  summary: NonNullable<ImportPreviewResult['summary']>;
  tableDetails: ImportPreviewTableDetail[];
}

function buildPlan(
  doc: ProjectImportDocument,
  current: ProjectExportSnapshot | null,
  syncDeletions: boolean,
): PlanResult {
  const summary = {
    tablesCreated: 0,
    tablesUpdated: 0,
    tablesDeleted: 0,
    fieldsCreated: 0,
    fieldsUpdated: 0,
    fieldsDeleted: 0,
    indexesCreated: 0,
    indexesUpdated: 0,
    indexesDeleted: 0,
  };
  const tableDetails: ImportPreviewTableDetail[] = [];

  const currentTables = current?.tables ?? [];
  const byPrefix = new Map(currentTables.map((t) => [t.prefix, t]));
  const importPrefixes = new Set(doc.tables.map((t) => t.prefix));

  if (syncDeletions) {
    for (const ct of currentTables) {
      if (!importPrefixes.has(ct.prefix) && !ct.deletedAt) {
        summary.tablesDeleted += 1;
      }
    }
  }

  for (const t of sortTables(doc.tables)) {
    const existing = byPrefix.get(t.prefix);
    const isBrandNew = !existing;
    if (isBrandNew) summary.tablesCreated += 1;
    else summary.tablesUpdated += 1;
    const action: 'create' | 'update' = isBrandNew ? 'create' : 'update';

    const fieldDetail = { create: [] as string[], update: [] as string[], delete: [] as string[] };
    const indexDetail = { create: [] as string[], update: [] as string[], delete: [] as string[] };

    const existingFieldNames = new Map(
      (existing?.fields ?? []).filter((f) => !f.deletedAt).map((f) => [f.name, f] as const),
    );
    const importFieldNames = new Set(t.fields.map((f) => f.name));

    for (const f of t.fields) {
      const ex = existingFieldNames.get(f.name);
      if (!ex) fieldDetail.create.push(f.name);
      else if (
        fieldJsonHash(ex as unknown as Record<string, unknown>) !==
        fieldJsonHash(f as unknown as Record<string, unknown>)
      )
        fieldDetail.update.push(f.name);
    }
    if (syncDeletions && existing) {
      for (const name of existingFieldNames.keys()) {
        if (!importFieldNames.has(name)) fieldDetail.delete.push(name);
      }
    }

    summary.fieldsCreated += fieldDetail.create.length;
    summary.fieldsUpdated += fieldDetail.update.length;
    summary.fieldsDeleted += fieldDetail.delete.length;

    const existingIndexOrders = new Map(
      (existing?.indexes ?? []).filter((i) => !i.deletedAt).map((i) => [i.order, i] as const),
    );
    const importOrders = new Set(t.indexes.map((i) => i.order));

    for (const idx of t.indexes) {
      const ex = existingIndexOrders.get(idx.order);
      if (!ex) indexDetail.create.push(idx.order);
      else if (
        indexJsonHash(ex as unknown as Record<string, unknown>) !==
        indexJsonHash(idx as unknown as Record<string, unknown>)
      )
        indexDetail.update.push(idx.order);
    }
    if (syncDeletions && existing) {
      for (const ord of existingIndexOrders.keys()) {
        if (!importOrders.has(ord)) indexDetail.delete.push(ord);
      }
    }

    summary.indexesCreated += indexDetail.create.length;
    summary.indexesUpdated += indexDetail.update.length;
    summary.indexesDeleted += indexDetail.delete.length;

    tableDetails.push({
      prefix: t.prefix,
      action,
      fields: fieldDetail,
      indexes: indexDetail,
    });
  }

  return { summary, tableDetails };
}

function fieldJsonHash(row: Record<string, unknown>): string {
  const { id: _id, tableId: _tid, createdAt: _c, updatedAt: _u, deletedAt: _d, ...rest } = row;
  return stableStringify(rest as Record<string, unknown>);
}

function indexJsonHash(row: Record<string, unknown>): string {
  const { id: _id, tableId: _tid, createdAt: _c, updatedAt: _u, deletedAt: _d, ...rest } = row;
  return stableStringify(rest as Record<string, unknown>);
}

function stableStringify(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const normalized: Record<string, unknown> = {};
  for (const k of keys) normalized[k] = obj[k];
  return JSON.stringify(normalized);
}

function sortTables<T extends { prefix: string }>(tables: T[]): T[] {
  return [...tables].sort((a, b) => a.prefix.localeCompare(b.prefix));
}

async function applyTableDeletions(
  tx: Tx,
  projectId: string,
  doc: ProjectImportDocument,
): Promise<void> {
  const importPrefixes = new Set(doc.tables.map((t) => t.prefix));
  const prefixList = [...importPrefixes];
  const orphans = await tx.table.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(prefixList.length > 0 ? { prefix: { notIn: prefixList } } : {}),
    },
    select: { id: true },
  });
  for (const o of orphans) {
    await softDeleteTableCascade(tx, o.id);
  }
}

async function softDeleteTableCascade(tx: Tx, tableId: string): Promise<void> {
  const now = new Date();
  let slot = 90;
  const nextTrashOrder = async (): Promise<string> => {
    while (slot <= 99) {
      const candidate = String(slot).padStart(2, '0');
      const clash = await tx.field.findFirst({
        where: { tableId, order: candidate, deletedAt: null },
        select: { id: true },
      });
      if (!clash) return candidate;
      slot += 1;
    }
    throw new Error('Esgotados slots temporários de ordem para exclusão de campos (90-99).');
  };

  const fields = await tx.field.findMany({ where: { tableId, deletedAt: null } });
  for (const f of fields) {
    const trash = await nextTrashOrder();
    await tx.field.update({ where: { id: f.id }, data: { order: trash, deletedAt: now } });
  }

  slot = 90;
  const nextTrashIndexOrder = async (): Promise<string> => {
    while (slot <= 99) {
      const ord = String(slot);
      const clash = await tx.index.findFirst({
        where: { tableId, order: ord, deletedAt: null },
        select: { id: true },
      });
      if (!clash) return ord;
      slot += 1;
    }
    throw new Error('Esgotados slots temporários de ordem para exclusão de índices (90-99).');
  };

  const indexes = await tx.index.findMany({ where: { tableId, deletedAt: null } });
  for (const ix of indexes) {
    const trash = await nextTrashIndexOrder();
    await tx.index.update({ where: { id: ix.id }, data: { order: trash, deletedAt: now } });
  }

  await tx.table.update({ where: { id: tableId }, data: { deletedAt: now } });
}

async function upsertTable(
  tx: Tx,
  projectId: string,
  t: ProjectImportDocument['tables'][number],
  syncDeletions: boolean,
): Promise<void> {
  const tableData = toTableScalars(t);
  let tableRow = await tx.table.findFirst({
    where: { projectId, prefix: t.prefix },
  });

  if (!tableRow) {
    tableRow = await tx.table.create({
      data: { ...tableData, projectId },
    });
  } else if (tableRow.deletedAt) {
    tableRow = await tx.table.update({
      where: { id: tableRow.id },
      data: { ...tableData, deletedAt: null },
    });
  } else {
    tableRow = await tx.table.update({
      where: { id: tableRow.id },
      data: tableData,
    });
  }

  const tableId = tableRow.id;

  if (syncDeletions) {
    const keepNames = new Set(t.fields.map((f) => f.name));
    const activeFields = await tx.field.findMany({ where: { tableId, deletedAt: null } });
    for (const f of activeFields) {
      if (!keepNames.has(f.name)) {
        const forbidden = new Set(t.fields.map((row) => row.order));
        const trash = await nextFreeFieldOrder(tx, tableId, forbidden);
        await tx.field.update({
          where: { id: f.id },
          data: { order: trash, deletedAt: new Date() },
        });
      }
    }
    const keepOrders = new Set(t.indexes.map((i) => i.order));
    const activeIndexes = await tx.index.findMany({ where: { tableId, deletedAt: null } });
    for (const ix of activeIndexes) {
      if (!keepOrders.has(ix.order)) {
        const forbiddenIdx = new Set(t.indexes.map((row) => row.order));
        const trash = await nextFreeIndexOrder(tx, tableId, forbiddenIdx);
        await tx.index.update({
          where: { id: ix.id },
          data: { order: trash, deletedAt: new Date() },
        });
      }
    }
  }

  for (const f of sortFields(t.fields)) {
    await upsertField(tx, tableId, f);
  }

  for (const ix of sortIndexes(t.indexes)) {
    await upsertIndex(tx, tableId, ix);
  }
}

async function nextFreeFieldOrder(
  tx: Tx,
  tableId: string,
  forbidden: Set<string>,
): Promise<string> {
  for (let slot = 90; slot <= 99; slot += 1) {
    const candidate = String(slot).padStart(2, '0');
    if (forbidden.has(candidate)) continue;
    const clash = await tx.field.findFirst({
      where: { tableId, order: candidate, deletedAt: null },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw new Error('Sem ordem temporária livre para campo (90-99).');
}

async function nextFreeIndexOrder(
  tx: Tx,
  tableId: string,
  forbidden: Set<string>,
): Promise<string> {
  for (let slot = 90; slot <= 99; slot += 1) {
    const ord = String(slot);
    if (forbidden.has(ord)) continue;
    const clash = await tx.index.findFirst({
      where: { tableId, order: ord, deletedAt: null },
      select: { id: true },
    });
    if (!clash) return ord;
  }
  throw new Error('Sem ordem temporária livre para índice (90-99).');
}

function sortFields<F extends { order: string }>(fields: F[]): F[] {
  return [...fields].sort((a, b) => a.order.localeCompare(b.order));
}

function sortIndexes<I extends { order: string }>(indexes: I[]): I[] {
  return [...indexes].sort((a, b) => a.order.localeCompare(b.order, undefined, { numeric: true }));
}

async function upsertField(
  tx: Tx,
  tableId: string,
  f: ProjectImportDocument['tables'][number]['fields'][number],
): Promise<void> {
  const scalars = toFieldScalars(f);
  const existing = await tx.field.findFirst({ where: { tableId, name: f.name } });

  if (!existing) {
    await tx.field.create({ data: { ...scalars, tableId } });
    return;
  }

  if (existing.deletedAt) {
    await tx.field.update({
      where: { id: existing.id },
      data: { ...scalars, deletedAt: null },
    });
    return;
  }

  await tx.field.update({
    where: { id: existing.id },
    data: scalars,
  });
}

function toFieldScalars(
  f: ProjectImportDocument['tables'][number]['fields'][number],
): Omit<Prisma.FieldUncheckedCreateInput, 'tableId'> {
  return {
    name: f.name,
    order: f.order,
    type: f.type,
    size: f.size,
    decimals: f.decimals,
    titlePt: f.titlePt,
    titleEs: f.titleEs ?? null,
    titleEn: f.titleEn ?? null,
    descPt: f.descPt,
    descEs: f.descEs ?? null,
    descEn: f.descEn ?? null,
    picture: f.picture ?? null,
    pictureVar: f.pictureVar ?? null,
    pictureBrowse: f.pictureBrowse ?? null,
    validation: f.validation ?? null,
    userValidation: f.userValidation ?? null,
    defaultRel: f.defaultRel ?? null,
    whenExpr: f.whenExpr ?? null,
    initBrowse: f.initBrowse ?? null,
    comboPt: f.comboPt ?? null,
    comboEs: f.comboEs ?? null,
    comboEn: f.comboEn ?? null,
    searchKey: f.searchKey ?? null,
    visualMode: f.visualMode,
    contextMode: f.contextMode,
    owner: f.owner,
    required: f.required ?? null,
    showBrowse: f.showBrowse,
    hasCheck: f.hasCheck,
    hasTrigger: f.hasTrigger,
    level: f.level,
    pyme: f.pyme,
    serverIndex: f.serverIndex,
    fieldIndex: f.fieldIndex,
    spelling: f.spelling,
    modal: f.modal,
    positionLogix: f.positionLogix,
    usadoFlags: f.usadoFlags as Prisma.InputJsonValue,
    modulesFlags: f.modulesFlags as Prisma.InputJsonValue,
    sqlCondition: f.sqlCondition ?? null,
    sqlCheck: f.sqlCheck ?? null,
    groupSxg: f.groupSxg ?? null,
    folder: f.folder ?? null,
    screen: f.screen ?? null,
    grouping: f.grouping ?? null,
    reserved: f.reserved ?? null,
    notes: f.notes ?? null,
  };
}

async function upsertIndex(
  tx: Tx,
  tableId: string,
  ix: ProjectImportDocument['tables'][number]['indexes'][number],
): Promise<void> {
  const scalars = toIndexScalars(ix);
  const existing = await tx.index.findFirst({
    where: { tableId, order: ix.order },
  });

  if (!existing) {
    await tx.index.create({ data: { ...scalars, tableId } });
    return;
  }

  if (existing.deletedAt) {
    await tx.index.update({
      where: { id: existing.id },
      data: { ...scalars, deletedAt: null },
    });
    return;
  }

  await tx.index.update({
    where: { id: existing.id },
    data: scalars,
  });
}

function toIndexScalars(
  ix: ProjectImportDocument['tables'][number]['indexes'][number],
): Omit<Prisma.IndexUncheckedCreateInput, 'tableId'> {
  return {
    order: ix.order,
    key: ix.key,
    descPt: ix.descPt,
    descEs: ix.descEs ?? null,
    descEn: ix.descEn ?? null,
    owner: ix.owner,
    searchExpr: ix.searchExpr ?? null,
    nickname: ix.nickname ?? null,
    showSearch: ix.showSearch,
    isVirtual: ix.isVirtual,
    virtualCustomizable: ix.virtualCustomizable,
    notes: ix.notes ?? null,
  };
}

function toTableScalars(
  t: ProjectImportDocument['tables'][number],
): Omit<
  Prisma.TableCreateInput,
  'project' | 'fields' | 'indexes' | 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {
  return {
    prefix: t.prefix,
    fileName: t.fileName,
    namePt: t.namePt,
    nameEs: t.nameEs ?? null,
    nameEn: t.nameEn ?? null,
    routine: t.routine ?? null,
    modeCompany: t.modeCompany,
    modeUnit: t.modeUnit,
    modeBranch: t.modeBranch,
    ttsEnabled: t.ttsEnabled,
    uniqueKey: t.uniqueKey ?? null,
    pyme: t.pyme,
    modules: t.modules,
    hasClob: t.hasClob,
    autoIncRec: t.autoIncRec,
    tamFil: t.tamFil,
    tamUn: t.tamUn,
    tamEmp: t.tamEmp,
    notes: t.notes ?? null,
  };
}
