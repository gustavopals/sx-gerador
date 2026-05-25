import { describe, expect, it } from 'vitest';
import { diffMigrationItems } from './migration-diff';
import type { MigrationItemSnapshot } from './types';

const item = (id: string, operation: string, targetName: string): MigrationItemSnapshot => ({
  id,
  operation,
  targetType: 'FIELD',
  targetName,
  beforeState: null,
  afterState: { name: targetName },
});

describe('diffMigrationItems', () => {
  it('detects items only in A or B', () => {
    const result = diffMigrationItems(
      [item('1', 'CREATE_FIELD', 'ZZZ_COD')],
      [item('2', 'CREATE_FIELD', 'ZZZ_NOME')],
    );
    expect(result.summary.onlyInACount).toBe(1);
    expect(result.summary.onlyInBCount).toBe(1);
  });

  it('detects changed item states', () => {
    const a = item('1', 'ALTER_FIELD', 'ZZZ_COD');
    a.afterState = { name: 'ZZZ_COD', titlePt: 'A' };
    const b = item('1', 'ALTER_FIELD', 'ZZZ_COD');
    b.afterState = { name: 'ZZZ_COD', titlePt: 'B' };
    const result = diffMigrationItems([a], [b]);
    expect(result.summary.changedCount).toBe(1);
    expect(result.changed[0].changes.length).toBeGreaterThan(0);
  });
});
