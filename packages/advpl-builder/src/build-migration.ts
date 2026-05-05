import { buildFooter, buildHeader } from './templates/header.tpl';
import type { BuildResult, MigrationInput, ValidationError } from './types';
import { validateMigration } from './validators/migration.validator';

/**
 * Gera o código AdvPL (.PRW) de uma migration a partir de seus itens.
 *
 * Esta é a função principal do pacote. Recebe os dados completos da migration
 * e devolve o código AdvPL pronto para download.
 *
 * O algoritmo completo está descrito na seção 14.3 do IDEIA.md.
 * Implementação completa nas Tasks F6.3+.
 *
 * @param input - Dados da migration (projeto, autor, itens de operação)
 * @returns Resultado com código gerado, helper e avisos
 * @throws {Error} Se houver erros de validação bloqueantes
 */
export function buildMigration(input: MigrationInput): string {
  const migrationInput = input;

  const errors: ValidationError[] = validateMigration(migrationInput);
  if (errors.length > 0) {
    const messages = errors.map((e) => `[${e.code}] ${e.message}`).join('\n');
    throw new Error(`Validação falhou:\n${messages}`);
  }

  const seq = String(migrationInput.sequence).padStart(3, '0');
  const funcName = `U_SXG${seq}Migration`;

  const header = buildHeader(migrationInput);
  const footer = buildFooter(migrationInput);

  // TODO (Task F6.3): gerar blocos reais de criação/alteração/exclusão
  // de tabelas, campos e índices processando migrationInput.items
  const bodyPlaceholder = [
    `User Function SXG${seq}Migration()`,
    `    // TODO (Task F6.3): geração real dos blocos SX2/SX3/SIX`,
    `    // ${migrationInput.items.length} item(s) a processar`,
    `    MsgStop("${funcName}: stub — implemente na Task F6.3", "SXGerador")`,
  ].join('\n');

  return [header, bodyPlaceholder, footer].join('\n\n');
}

/**
 * Variante tipada de buildMigration que retorna também o helper e avisos.
 *
 * @param input - Dados da migration
 * @returns BuildResult com código, helper e warnings
 * @todo Implementar na Task F6.3
 */
export function buildMigrationFull(input: MigrationInput): BuildResult {
  const code = buildMigration(input);

  // TODO (Task F6.3): gerar helper real e coletar warnings
  return {
    code,
    helperCode: '',
    warnings: [],
  };
}
