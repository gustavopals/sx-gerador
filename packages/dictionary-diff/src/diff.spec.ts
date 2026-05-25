import { describe, expect, it } from 'vitest';
import { diff } from './diff';
import { snapshotFromExportTables } from './snapshot';
import type { DictionarySnapshot } from './types';

const baseTable = {
  prefix: 'ZZZ',
  fileName: 'ZZZ010',
  namePt: 'Teste',
  nameEs: null,
  nameEn: null,
  routine: null,
  modeCompany: 'C' as const,
  modeUnit: 'C' as const,
  modeBranch: 'C' as const,
  ttsEnabled: 'S' as const,
  uniqueKey: 'ZZZ_FILIAL+ZZZ_COD',
  pyme: 'N' as const,
  modules: 0,
  hasClob: 'N' as const,
  autoIncRec: 'N' as const,
  tamFil: 2,
  tamUn: 2,
  tamEmp: 2,
  notes: null,
  fields: [
    {
      name: 'ZZZ_FILIAL',
      order: '01',
      type: 'C',
      size: 2,
      decimals: 0,
      titlePt: 'Filial',
      descPt: 'Filial',
      showBrowse: 'S',
      visualMode: 'A',
      contextMode: 'R',
      owner: 'U',
      level: 0,
      usadoFlags: {},
      modulesFlags: {},
    },
  ],
  indexes: [
    {
      order: '1',
      key: 'ZZZ_FILIAL+ZZZ_COD',
      descPt: 'Chave',
      owner: 'U',
      showSearch: 'S',
      isVirtual: 'N',
      virtualCustomizable: 'N',
    },
  ],
};

describe('diff', () => {
  it('detects added table', () => {
    const a: DictionarySnapshot = snapshotFromExportTables([]);
    const b: DictionarySnapshot = snapshotFromExportTables([baseTable]);
    const result = diff(a, b);
    expect(result.summary.tablesAdded).toBe(1);
    expect(result.tables[0].kind).toBe('added');
    expect(result.tables[0].prefix).toBe('ZZZ');
  });

  it('detects field change', () => {
    const a = snapshotFromExportTables([baseTable]);
    const changed = {
      ...baseTable,
      fields: [{ ...baseTable.fields[0], titlePt: 'Filial alterada' }],
    };
    const b = snapshotFromExportTables([changed]);
    const result = diff(a, b);
    expect(result.summary.tablesChanged).toBe(1);
    expect(result.summary.fieldsChanged).toBe(1);
    expect(result.tables[0].fields[0].changes.length).toBeGreaterThan(0);
  });

  it('detects removed table', () => {
    const a = snapshotFromExportTables([baseTable]);
    const b = snapshotFromExportTables([]);
    const result = diff(a, b);
    expect(result.summary.tablesRemoved).toBe(1);
  });
});
