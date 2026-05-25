import type { DictionarySnapshot, DictionaryTableSnapshot } from './types';

const TABLE_SCALAR_KEYS = [
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
] as const;

const FIELD_SCALAR_KEYS = [
  'order',
  'type',
  'size',
  'decimals',
  'titlePt',
  'titleEs',
  'titleEn',
  'descPt',
  'descEs',
  'descEn',
  'picture',
  'validation',
  'defaultRel',
  'showBrowse',
  'visualMode',
  'contextMode',
  'owner',
  'searchKey',
  'level',
  'comboPt',
] as const;

const INDEX_SCALAR_KEYS = [
  'key',
  'descPt',
  'descEs',
  'descEn',
  'owner',
  'searchExpr',
  'nickname',
  'showSearch',
  'isVirtual',
  'virtualCustomizable',
] as const;

/** Normaliza entidade Prisma/export para snapshot comparável. */
export function snapshotFromExportTables(
  tables: Array<{
    prefix: string;
    fileName: string;
    namePt: string;
    nameEs?: string | null;
    nameEn?: string | null;
    routine?: string | null;
    modeCompany: string;
    modeUnit: string;
    modeBranch: string;
    ttsEnabled: string;
    uniqueKey?: string | null;
    pyme: string;
    modules: number;
    hasClob: string;
    autoIncRec: string;
    tamFil: number;
    tamUn: number;
    tamEmp: number;
    notes?: string | null;
    fields: Array<Record<string, unknown>>;
    indexes: Array<Record<string, unknown>>;
  }>,
): DictionarySnapshot {
  return {
    tables: tables.map((t) => tableToSnapshot(t)),
  };
}

function tableToSnapshot(t: {
  prefix: string;
  fileName: string;
  namePt: string;
  nameEs?: string | null;
  nameEn?: string | null;
  routine?: string | null;
  modeCompany: string;
  modeUnit: string;
  modeBranch: string;
  ttsEnabled: string;
  uniqueKey?: string | null;
  pyme: string;
  modules: number;
  hasClob: string;
  autoIncRec: string;
  tamFil: number;
  tamUn: number;
  tamEmp: number;
  notes?: string | null;
  fields: Array<Record<string, unknown>>;
  indexes: Array<Record<string, unknown>>;
}): DictionaryTableSnapshot {
  const table: Record<string, unknown> = {};
  for (const key of TABLE_SCALAR_KEYS) {
    table[key] = (t as Record<string, unknown>)[key] ?? null;
  }

  const fields: Record<string, Record<string, unknown>> = {};
  for (const f of t.fields) {
    const name = String(f['name'] ?? '');
    if (!name) continue;
    fields[name] = pickScalars(f, FIELD_SCALAR_KEYS);
    fields[name]['usadoFlags'] = stableJson(f['usadoFlags']);
    fields[name]['modulesFlags'] = stableJson(f['modulesFlags']);
  }

  const indexes: Record<string, Record<string, unknown>> = {};
  for (const ix of t.indexes) {
    const order = String(ix['order'] ?? '');
    if (!order) continue;
    indexes[order] = pickScalars(ix, INDEX_SCALAR_KEYS);
  }

  return { prefix: t.prefix, table, fields, indexes };
}

function pickScalars(
  row: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = row[key] ?? null;
  }
  return out;
}

function stableJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as unknown;
}
