import { describe, expect, it } from 'vitest';
import type { MigrationItemInput } from '../types';
import {
  buildIndexAlteration,
  buildIndexCreation,
  buildIndexDeletion,
  buildSix,
} from './index.builder';

describe('index.builder', () => {
  it('buildSix should generate SIX array with defaults', () => {
    const result = buildSix({
      order: '1',
      key: 'ZZZ_FILIAL+ZZZ_CODIGO',
    });

    expect(result).toContain('"1" ,;  // SIX.ORDEM');
    expect(result).toContain('"ZZZ_FILIAL+ZZZ_CODIGO" ,;  // SIX.CHAVE');
    expect(result).toContain('"U" ,;  // SIX.PROPRI');
  });

  it('buildIndexCreation should create SIX creation block', () => {
    const item: MigrationItemInput = {
      id: 'idx-1',
      operation: 'CREATE_INDEX',
      targetType: 'INDEX',
      targetName: '1',
      beforeState: null,
      afterState: {
        order: '1',
        key: 'ZZZ_FILIAL+ZZZ_CODIGO',
        descPt: 'Código',
        showSearch: 'S',
      },
    };

    expect(buildIndexCreation(item)).toMatchSnapshot();
  });

  it('buildIndexAlteration should create SIX update block', () => {
    const item: MigrationItemInput = {
      id: 'idx-2',
      operation: 'ALTER_INDEX',
      targetType: 'INDEX',
      targetName: '2',
      beforeState: { order: '2', key: 'ZZZ_FILIAL+ZZZ_NOME' },
      afterState: { order: '2', key: 'ZZZ_FILIAL+ZZZ_APELIDO', descPt: 'Apelido' },
    };

    expect(buildIndexAlteration(item)).toMatchSnapshot();
  });

  it('buildIndexDeletion should create SIX deletion block', () => {
    const item: MigrationItemInput = {
      id: 'idx-3',
      operation: 'DROP_INDEX',
      targetType: 'INDEX',
      targetName: '3',
      beforeState: { order: '3', key: 'ZZZ_FILIAL+ZZZ_OUTRO' },
      afterState: null,
    };

    expect(buildIndexDeletion(item)).toMatchSnapshot();
  });
});
