import { describe, expect, it } from 'vitest';
import type { MigrationItemInput } from '../types';
import {
  buildFieldAlteration,
  buildFieldCreation,
  buildFieldDeletion,
  buildSx3,
} from './field.builder';

describe('field.builder', () => {
  it('buildSx3 should generate SX3 array with defaults', () => {
    const result = buildSx3({
      name: 'ZZZ_CODIGO',
    });

    expect(result).toContain('"ZZZ_CODIGO" ,;  // X3_CAMPO');
    expect(result).toContain('"01" ,;  // X3_ORDEM');
    expect(result).toContain('"C" ,;  // X3_TIPO');
  });

  it('buildFieldCreation should create SX3 creation block', () => {
    const item: MigrationItemInput = {
      id: 'field-1',
      operation: 'CREATE_FIELD',
      targetType: 'FIELD',
      targetName: 'ZZZ_CODIGO',
      beforeState: null,
      afterState: {
        name: 'ZZZ_CODIGO',
        order: '02',
        type: 'C',
        size: 10,
        decimals: 0,
        titlePt: 'Código',
        descPt: 'Código do contrato',
        usadoFlags: { encoded: '1'.repeat(120) },
      },
    };

    expect(buildFieldCreation(item)).toMatchSnapshot();
  });

  it('buildFieldAlteration should create SX3 update block', () => {
    const item: MigrationItemInput = {
      id: 'field-2',
      operation: 'ALTER_FIELD',
      targetType: 'FIELD',
      targetName: 'ZZZ_CODIGO',
      beforeState: { name: 'ZZZ_CODIGO', titlePt: 'Código' },
      afterState: { name: 'ZZZ_CODIGO', titlePt: 'Código novo' },
    };

    expect(buildFieldAlteration(item)).toMatchSnapshot();
  });

  it('buildFieldDeletion should create SX3 deletion block', () => {
    const item: MigrationItemInput = {
      id: 'field-3',
      operation: 'DROP_FIELD',
      targetType: 'FIELD',
      targetName: 'ZZZ_CODIGO',
      beforeState: { name: 'ZZZ_CODIGO' },
      afterState: null,
    };

    expect(buildFieldDeletion(item)).toMatchSnapshot();
  });
});
