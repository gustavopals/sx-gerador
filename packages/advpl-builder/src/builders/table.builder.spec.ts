import { describe, expect, it } from 'vitest';
import type { MigrationItemInput } from '../types';
import {
  buildSx2,
  buildTableAlteration,
  buildTableCreation,
  buildTableDeletion,
} from './table.builder';

describe('table.builder', () => {
  it('buildSx2 should generate SX2 array with defaults', () => {
    const result = buildSx2({
      prefix: 'ZZZ',
    });

    expect(result).toMatchInlineSnapshot(`
      "    aTabela := {;
              "ZZZ"                 ,;  // X2_CHAVE
              "ZZZ010"              ,;  // X2_ARQUIVO
              "ZZZ" ,;  // X2_NOME
              "" ,;  // X2_NOMESPA
              "" ,;  // X2_NOMEENG
              "C"                   ,;  // X2_MODO
              "S"                   ,;  // X2_TTS
              "" ;   // X2_UNICO
          }"
    `);
  });

  it('buildTableCreation should create SX2 creation block', () => {
    const item: MigrationItemInput = {
      id: 'item-1',
      operation: 'CREATE_TABLE',
      targetType: 'TABLE',
      targetName: 'ZZZ',
      beforeState: null,
      afterState: {
        prefix: 'ZZZ',
        fileName: 'ZZZ010',
        namePt: 'Cadastro de Contratos',
        modeCompany: 'C',
        ttsEnabled: 'S',
        uniqueKey: 'ZZZ_FILIAL+ZZZ_CODIGO',
      },
    };

    expect(buildTableCreation(item)).toMatchSnapshot();
  });

  it('buildTableAlteration should create SX2 update block', () => {
    const item: MigrationItemInput = {
      id: 'item-2',
      operation: 'ALTER_TABLE',
      targetType: 'TABLE',
      targetName: 'ZZZ',
      beforeState: { prefix: 'ZZZ', namePt: 'Antigo' },
      afterState: { prefix: 'ZZZ', namePt: 'Novo nome' },
    };

    expect(buildTableAlteration(item)).toMatchSnapshot();
  });

  it('buildTableDeletion should create SX2 deletion block', () => {
    const item: MigrationItemInput = {
      id: 'item-3',
      operation: 'DROP_TABLE',
      targetType: 'TABLE',
      targetName: 'ZZZ',
      beforeState: { prefix: 'ZZZ' },
      afterState: null,
    };

    expect(buildTableDeletion(item)).toMatchSnapshot();
  });
});
