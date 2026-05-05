import type { MigrationItemInput } from '../types';

/**
 * Gera o bloco AdvPL de criação de um campo (SX3).
 *
 * @param _item - Item da migration com afterState contendo dados do campo
 * @returns Trecho AdvPL para criação de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldCreation(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real do bloco SX3
  throw new Error('buildFieldCreation: não implementado ainda (Task F6.3)');
}

/**
 * Gera o bloco AdvPL de alteração de um campo (SX3).
 *
 * @param _item - Item da migration com before/afterState
 * @returns Trecho AdvPL para alteração de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldAlteration(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real
  throw new Error('buildFieldAlteration: não implementado ainda (Task F6.3)');
}

/**
 * Gera o bloco AdvPL de exclusão de um campo (SX3).
 *
 * @param _item - Item da migration com beforeState contendo dados do campo
 * @returns Trecho AdvPL para exclusão de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldDeletion(_item: MigrationItemInput): string {
  // TODO (Task F6.3): implementar geração real
  throw new Error('buildFieldDeletion: não implementado ainda (Task F6.3)');
}
