import type {
  DictionarySnapshot,
  DiffResult,
  DiffSummary,
  EntityDiff,
  ScalarChange,
  TableDiff,
} from './types';

export function diff(stateA: DictionarySnapshot, stateB: DictionarySnapshot): DiffResult {
  const mapA = new Map(stateA.tables.map((t) => [t.prefix, t]));
  const mapB = new Map(stateB.tables.map((t) => [t.prefix, t]));
  const prefixes = new Set([...mapA.keys(), ...mapB.keys()]);
  const tables: TableDiff[] = [];

  const summary: DiffSummary = {
    tablesAdded: 0,
    tablesRemoved: 0,
    tablesChanged: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsChanged: 0,
    indexesAdded: 0,
    indexesRemoved: 0,
    indexesChanged: 0,
  };

  for (const prefix of [...prefixes].sort()) {
    const a = mapA.get(prefix);
    const b = mapB.get(prefix);

    if (a && !b) {
      tables.push({
        prefix,
        kind: 'removed',
        tableChanges: [],
        fields: Object.keys(a.fields).map((name) => ({ key: name, kind: 'removed', changes: [] })),
        indexes: Object.keys(a.indexes).map((order) => ({
          key: order,
          kind: 'removed',
          changes: [],
        })),
      });
      summary.tablesRemoved += 1;
      summary.fieldsRemoved += Object.keys(a.fields).length;
      summary.indexesRemoved += Object.keys(a.indexes).length;
      continue;
    }

    if (!a && b) {
      tables.push({
        prefix,
        kind: 'added',
        tableChanges: [],
        fields: Object.keys(b.fields).map((name) => ({ key: name, kind: 'added', changes: [] })),
        indexes: Object.keys(b.indexes).map((order) => ({
          key: order,
          kind: 'added',
          changes: [],
        })),
      });
      summary.tablesAdded += 1;
      summary.fieldsAdded += Object.keys(b.fields).length;
      summary.indexesAdded += Object.keys(b.indexes).length;
      continue;
    }

    if (a && b) {
      const tableChanges = diffScalars(a.table, b.table, 'table');
      const fields = diffEntityMap(a.fields, b.fields, 'field');
      const indexes = diffEntityMap(a.indexes, b.indexes, 'index');

      const hasChanges =
        tableChanges.length > 0 ||
        fields.some((f) => f.kind !== 'changed' || f.changes.length > 0) ||
        indexes.some((i) => i.kind !== 'changed' || i.changes.length > 0);

      if (hasChanges) {
        tables.push({
          prefix,
          kind: 'changed',
          tableChanges,
          fields,
          indexes,
        });
        summary.tablesChanged += 1;
      }

      for (const f of fields) {
        if (f.kind === 'added') summary.fieldsAdded += 1;
        else if (f.kind === 'removed') summary.fieldsRemoved += 1;
        else if (f.changes.length > 0) summary.fieldsChanged += 1;
      }
      for (const ix of indexes) {
        if (ix.kind === 'added') summary.indexesAdded += 1;
        else if (ix.kind === 'removed') summary.indexesRemoved += 1;
        else if (ix.changes.length > 0) summary.indexesChanged += 1;
      }
    }
  }

  return { tables, summary };
}

function diffEntityMap(
  mapA: Record<string, Record<string, unknown>>,
  mapB: Record<string, Record<string, unknown>>,
  label: string,
): EntityDiff[] {
  const keys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
  const result: EntityDiff[] = [];

  for (const key of [...keys].sort()) {
    const a = mapA[key];
    const b = mapB[key];
    if (a && !b) {
      result.push({ key, kind: 'removed', changes: [] });
      continue;
    }
    if (!a && b) {
      result.push({ key, kind: 'added', changes: [] });
      continue;
    }
    if (a && b) {
      const changes = diffScalars(a, b, `${label}.${key}`);
      if (changes.length > 0) {
        result.push({ key, kind: 'changed', changes });
      }
    }
  }

  return result;
}

function diffScalars(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  basePath: string,
): ScalarChange[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changes: ScalarChange[] = [];

  for (const key of [...keys].sort()) {
    const va = a[key];
    const vb = b[key];
    if (!deepEqual(va, vb)) {
      changes.push({ path: `${basePath}.${key}`, before: va, after: vb });
    }
  }

  return changes;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
