import type { MigrationInput } from '../types';

/**
 * Gera o cabeçalho AdvPL (Protheus.doc) para a migration.
 *
 * @param migration - Dados da migration
 * @returns String com o bloco de cabeçalho
 * @todo Implementar na Task F6.3
 */
export function buildHeader(migration: MigrationInput): string {
  const seq = String(migration.sequence).padStart(3, '0');
  const date = new Date().toLocaleDateString('pt-BR');

  return [
    '#INCLUDE "PROTHEUS.CH"',
    '',
    '/*/',
    `{Protheus.doc} U_SXG${seq}Migration`,
    `@description Migration gerada por SXGerador — ${migration.name}`,
    `@author ${migration.author.name} (${migration.author.email})`,
    `@since ${date}`,
    `@version 1.0`,
    `@type function`,
    `@migration ${seq}`,
    `@project ${migration.project.slug}`,
    '/*/',
  ].join('\n');
}

/**
 * Gera o rodapé AdvPL da função de migration.
 *
 * @param migration - Dados da migration
 * @returns String com o rodapé
 * @todo Implementar na Task F6.3
 */
export function buildFooter(migration: MigrationInput): string {
  const seq = String(migration.sequence).padStart(3, '0');
  return `    MsgInfo("Migration ${seq} aplicada com sucesso!", "SXGerador")\nReturn Nil`;
}
