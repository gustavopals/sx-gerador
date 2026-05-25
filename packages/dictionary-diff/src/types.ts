export type ChangeKind = 'added' | 'removed' | 'changed';

export interface ScalarChange {
  path: string;
  before: unknown;
  after: unknown;
}

export interface EntityDiff {
  key: string;
  kind: ChangeKind;
  changes: ScalarChange[];
}

export interface TableDiff {
  prefix: string;
  kind: ChangeKind;
  tableChanges: ScalarChange[];
  fields: EntityDiff[];
  indexes: EntityDiff[];
}

export interface DiffSummary {
  tablesAdded: number;
  tablesRemoved: number;
  tablesChanged: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  fieldsChanged: number;
  indexesAdded: number;
  indexesRemoved: number;
  indexesChanged: number;
}

export interface DiffResult {
  tables: TableDiff[];
  summary: DiffSummary;
}

export interface DictionaryTableSnapshot {
  prefix: string;
  table: Record<string, unknown>;
  fields: Record<string, Record<string, unknown>>;
  indexes: Record<string, Record<string, unknown>>;
}

export interface DictionarySnapshot {
  tables: DictionaryTableSnapshot[];
}

export interface MigrationItemSnapshot {
  id: string;
  operation: string;
  targetType: string;
  targetName: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

export interface MigrationItemsDiffEntry {
  kind: ChangeKind;
  item: MigrationItemSnapshot;
  paired?: MigrationItemSnapshot;
}

export interface MigrationItemsDiffResult {
  onlyInA: MigrationItemSnapshot[];
  onlyInB: MigrationItemSnapshot[];
  changed: Array<{
    key: string;
    before: MigrationItemSnapshot;
    after: MigrationItemSnapshot;
    changes: ScalarChange[];
  }>;
  summary: {
    onlyInACount: number;
    onlyInBCount: number;
    changedCount: number;
  };
}
