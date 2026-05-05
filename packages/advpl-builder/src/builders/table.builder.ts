import type { MigrationItemInput } from '../types';

/**
 * Gera o bloco AdvPL de criação de uma tabela (SX2).
 *
 * @param _item - Item da migration com afterState contendo dados da tabela
 * @returns Trecho AdvPL para criação de tabela
 * @todo Implementar na Task F6.3
 */
export function buildTableCreation(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real do bloco SX2
  throw new Error('buildTableCreation: não implementado ainda (Task F6.3)');
}

/**
 * Gera o bloco AdvPL de alteração de uma tabela (SX2).
 *
 * @param _item - Item da migration com before/afterState
 * @returns Trecho AdvPL para alteração de tabela
 * @todo Implementar na Task F6.3
 */
export function buildTableAlteration(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real
  throw new Error('buildTableAlteration: não implementado ainda (Task F6.3)');
}

/**
 * Gera o bloco AdvPL de exclusão de uma tabela (SX2).
 *
 * @param _item - Item da migration com beforeState contendo dados da tabela
 * @returns Trecho AdvPL para exclusão de tabela
 * @todo Implementar na Task F6.3
 */
export function buildTableDeletion(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real
  throw new Error('buildTableDeletion: não implementado ainda (Task F6.3)');
}
