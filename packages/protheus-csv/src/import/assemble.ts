import { parseCsv } from '../csv/parse';
import { detectDictionaryKind } from '../detect';
import type { CsvImportInput, CsvImportResult, CsvTableDraft } from '../types';
import { mapSixRow } from './map-six';
import { mapSx2Row } from './map-sx2';
import { mapSx3Row } from './map-sx3';

function ensureTable(map: Map<string, CsvTableDraft>, prefix: string): CsvTableDraft {
  let table = map.get(prefix);
  if (!table) {
    table = {
      prefix,
      fileName: `${prefix}010`,
      namePt: prefix,
      nameEs: null,
      nameEn: null,
      routine: null,
      modeCompany: 'C',
      modeUnit: 'C',
      modeBranch: 'C',
      ttsEnabled: 'S',
      uniqueKey: null,
      pyme: 'N',
      modules: 0,
      hasClob: 'N',
      autoIncRec: 'N',
      tamFil: 2,
      tamUn: 2,
      tamEmp: 2,
      notes: null,
      fields: [],
      indexes: [],
    };
    map.set(prefix, table);
  }
  return table;
}

function mergeFields(table: CsvTableDraft, incoming: CsvTableDraft['fields']): void {
  const byName = new Map(table.fields.map((f) => [f.name, f]));
  for (const f of incoming) {
    byName.set(f.name, f);
  }
  table.fields = [...byName.values()].sort((a, b) => a.order.localeCompare(b.order));
}

function mergeIndexes(table: CsvTableDraft, incoming: CsvTableDraft['indexes']): void {
  const byOrder = new Map(table.indexes.map((i) => [i.order, i]));
  for (const ix of incoming) {
    byOrder.set(ix.order, ix);
  }
  table.indexes = [...byOrder.values()].sort((a, b) =>
    a.order.localeCompare(b.order, undefined, { numeric: true }),
  );
}

function ensurePrimaryIndex(table: CsvTableDraft, warnings: string[]): void {
  const hasPrimary = table.indexes.some((i) => i.order.trim() === '1');
  if (hasPrimary) return;

  if (table.uniqueKey) {
    table.indexes.unshift({
      order: '1',
      key: table.uniqueKey,
      descPt: 'Chave unica',
      descEs: null,
      descEn: null,
      owner: 'U',
      searchExpr: null,
      nickname: null,
      showSearch: 'S',
      isVirtual: 'N',
      virtualCustomizable: 'N',
      notes: null,
    });
    warnings.push(
      `[${table.prefix}] Índice ordem 1 gerado a partir de X2_UNICO (${table.uniqueKey}).`,
    );
    return;
  }

  if (table.fields.length > 0) {
    const filial = table.fields.find((f) => f.name.endsWith('_FILIAL'));
    const second = table.fields.find((f) => f.name !== filial?.name);
    const keyParts = [filial?.name, second?.name].filter(Boolean);
    if (keyParts.length > 0) {
      const key = keyParts.join('+');
      table.indexes.unshift({
        order: '1',
        key,
        descPt: 'Chave primaria (inferida)',
        descEs: null,
        descEn: null,
        owner: 'U',
        searchExpr: null,
        nickname: null,
        showSearch: 'S',
        isVirtual: 'N',
        virtualCustomizable: 'N',
        notes: null,
      });
      warnings.push(`[${table.prefix}] Índice ordem 1 inferido: ${key}. Revise antes de aplicar.`);
    }
  }
}

function ingestCsv(
  text: string | undefined,
  expected: 'sx2' | 'sx3' | 'six',
  map: Map<string, CsvTableDraft>,
  errors: string[],
): void {
  if (!text?.trim()) return;

  const { headers, rows } = parseCsv(text);
  if (headers.length === 0) {
    errors.push(`CSV ${expected.toUpperCase()}: cabeçalho vazio.`);
    return;
  }

  const kind = detectDictionaryKind(headers);
  if (kind !== expected) {
    errors.push(
      `CSV ${expected.toUpperCase()}: cabeçalho não reconhecido (esperado ${expected}, detectado ${kind ?? 'desconhecido'}).`,
    );
    return;
  }

  if (expected === 'sx2') {
    for (const row of rows) {
      const table = mapSx2Row(row);
      if (!table) continue;
      const existing = map.get(table.prefix);
      if (existing) {
        Object.assign(existing, { ...table, fields: existing.fields, indexes: existing.indexes });
      } else {
        map.set(table.prefix, table);
      }
    }
    return;
  }

  if (expected === 'sx3') {
    for (const row of rows) {
      const mapped = mapSx3Row(row);
      if (!mapped) continue;
      const table = ensureTable(map, mapped.prefix);
      mergeFields(table, [mapped.field]);
    }
    return;
  }

  for (const row of rows) {
    const mapped = mapSixRow(row);
    if (!mapped) continue;
    const table = ensureTable(map, mapped.prefix);
    mergeIndexes(table, [mapped.index]);
  }
}

/**
 * Monta tabelas a partir de até 3 CSVs (SX2, SX3, SIX) no formato SIGACFG/Protheus.
 */
export function assembleCsvImport(input: CsvImportInput): CsvImportResult {
  const map = new Map<string, CsvTableDraft>();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.sx2?.trim() && !input.sx3?.trim() && !input.six?.trim()) {
    return {
      tables: [],
      errors: ['Informe ao menos um arquivo CSV (SX2, SX3 ou SIX).'],
      warnings: [],
    };
  }

  ingestCsv(input.sx2, 'sx2', map, errors);
  ingestCsv(input.sx3, 'sx3', map, errors);
  ingestCsv(input.six, 'six', map, errors);

  if (errors.length > 0) {
    return { tables: [], errors, warnings };
  }

  const tables = [...map.values()].sort((a, b) => a.prefix.localeCompare(b.prefix));

  if (tables.length === 0) {
    return { tables: [], errors: ['Nenhuma linha válida encontrada nos CSVs.'], warnings };
  }

  for (const table of tables) {
    ensurePrimaryIndex(table, warnings);
  }

  return { tables, errors: [], warnings };
}
