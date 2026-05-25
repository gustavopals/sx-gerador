import type { MigrationItemsDiffResult, MigrationItemSnapshot, ScalarChange } from './types';

export function diffMigrationItems(
  itemsA: MigrationItemSnapshot[],
  itemsB: MigrationItemSnapshot[],
): MigrationItemsDiffResult {
  const keyOf = (item: MigrationItemSnapshot): string =>
    `${item.targetType}:${item.targetName}:${item.operation}`;

  const mapA = new Map(itemsA.map((i) => [keyOf(i), i]));
  const mapB = new Map(itemsB.map((i) => [keyOf(i), i]));

  const onlyInA: MigrationItemSnapshot[] = [];
  const onlyInB: MigrationItemSnapshot[] = [];
  const changed: MigrationItemsDiffResult['changed'] = [];

  for (const [key, itemA] of mapA) {
    const itemB = mapB.get(key);
    if (!itemB) {
      onlyInA.push(itemA);
      continue;
    }
    const changes = diffItemStates(itemA, itemB);
    if (changes.length > 0) {
      changed.push({ key, before: itemA, after: itemB, changes });
    }
    mapB.delete(key);
  }

  for (const item of mapB.values()) {
    onlyInB.push(item);
  }

  return {
    onlyInA,
    onlyInB,
    changed,
    summary: {
      onlyInACount: onlyInA.length,
      onlyInBCount: onlyInB.length,
      changedCount: changed.length,
    },
  };
}

function diffItemStates(a: MigrationItemSnapshot, b: MigrationItemSnapshot): ScalarChange[] {
  const changes: ScalarChange[] = [];
  if (a.operation !== b.operation) {
    changes.push({ path: 'operation', before: a.operation, after: b.operation });
  }
  const beforeChanges = diffRecords(a.beforeState, b.beforeState, 'beforeState');
  const afterChanges = diffRecords(a.afterState, b.afterState, 'afterState');
  return [...changes, ...beforeChanges, ...afterChanges];
}

function diffRecords(
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null,
  base: string,
): ScalarChange[] {
  if (!a && !b) return [];
  if (!a && b) return [{ path: base, before: null, after: b }];
  if (a && !b) return [{ path: base, before: a, after: null }];
  const keys = new Set([...Object.keys(a!), ...Object.keys(b!)]);
  const changes: ScalarChange[] = [];
  for (const key of [...keys].sort()) {
    const va = a![key];
    const vb = b![key];
    if (JSON.stringify(va) !== JSON.stringify(vb)) {
      changes.push({ path: `${base}.${key}`, before: va, after: vb });
    }
  }
  return changes;
}
