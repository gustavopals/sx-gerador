import { describe, expect, it } from 'vitest';
import { buildMigration } from './build-migration';
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
    expect(result).toContain('User Function SXG001Migration');
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
    expect(result).toContain('0 item(s) a processar');
  });

  it('aceita input como any (compatibilidade com a task F0.9)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = buildMigration(MIGRATION_FIXTURE as any);
    expect(typeof result).toBe('string');
  });
});
