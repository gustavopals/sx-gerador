import { describe, expect, it } from 'vitest';
import { buildMigration, buildMigrationFull, buildMigrationFunctionName } from './build-migration';
import type { MigrationInput } from './types';

const MIGRATION_FIXTURE: MigrationInput = {
  id: 'clwxyz001',
  sequence: 1,
  name: 'Cria tabela ZZZ',
  project: {
    name: 'Meu Projeto',
    slug: 'meu-projeto',
  },
  author: {
    name: 'Gustavo Pals',
    email: 'gustavo@example.com',
  },
  items: [
    {
      id: 'item001',
      operation: 'CREATE_TABLE',
      targetType: 'TABLE',
      targetName: 'ZZZ',
      beforeState: null,
      afterState: { prefix: 'ZZZ', fileName: 'ZZZ010', name: 'Cadastro de Contratos' },
    },
    {
      id: 'item002',
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
    },
    {
      id: 'item003',
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
    },
  ],
};

describe('buildMigration (smoke tests)', () => {
  it('retorna uma string não-vazia', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contém o cabeçalho Protheus.doc', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('#INCLUDE "PROTHEUS.CH"');
    expect(result).toContain('{Protheus.doc}');
  });

  it('contém a declaração da função AdvPL', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('User Function SXG001CriaZZZ()');
  });

  it('contém Return Nil no rodapé', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('Return Nil');
  });

  it('inclui a sequência formatada com 3 dígitos', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('001');
  });

  it('inclui nome do projeto no cabeçalho', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('meu-projeto');
  });

  it('inclui author no cabeçalho', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('Gustavo Pals');
    expect(result).toContain('gustavo@example.com');
  });

  it('aceita input sem items (migration vazia)', () => {
    const emptyMigration: MigrationInput = { ...MIGRATION_FIXTURE, items: [] };
    const result = buildMigration(emptyMigration);
    expect(typeof result).toBe('string');
    expect(result).toContain('Nenhuma operação SX2 nesta migration');
  });

  it('gera bloco SX2 para criação de tabela', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('// SX2 - Criação da tabela ZZZ');
    expect(result).toContain('U_SXGCriaSX2(aTabela)');
  });

  it('gera bloco SX3 para criação de campo', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('// SX3 - Criação do campo ZZZ_CODIGO');
    expect(result).toContain('U_SXGCriaSX3(aCampo)');
  });

  it('gera bloco SIX para criação de índice', () => {
    const result = buildMigration(MIGRATION_FIXTURE);
    expect(result).toContain('// SIX - Criação do índice 1');
    expect(result).toContain('U_SXGCriaIdx(aIndice)');
  });

  it('aceita input como any (compatibilidade com a task F0.9)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = buildMigration(MIGRATION_FIXTURE as any);
    expect(typeof result).toBe('string');
  });

  it('gera nome de função sequencial e contextual', () => {
    const fn = buildMigrationFunctionName(12, MIGRATION_FIXTURE.items);
    expect(fn).toBe('SXG012CriaZZZ');
  });

  it('buildMigrationFull retorna helper AdvPL', () => {
    const result = buildMigrationFull(MIGRATION_FIXTURE);
    expect(result.helperCode).toContain('User Function SXGCriaSX2');
    expect(result.helperCode).toContain('dbSelectArea(cAlias)');
    expect(result.helperCode).toContain('RecLock(cAlias, .F.)');
    expect(result.helperCode).toContain('MsUnLock()');
    expect(result.code).toContain('User Function SXG001CriaZZZ()');
  });
});
