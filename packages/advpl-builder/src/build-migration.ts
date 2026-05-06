import {
  buildFieldAlteration,
  buildFieldCreation,
  buildFieldDeletion,
} from './builders/field.builder';
import {
  buildIndexAlteration,
  buildIndexCreation,
  buildIndexDeletion,
} from './builders/index.builder';
import {
  buildTableAlteration,
  buildTableCreation,
  buildTableDeletion,
} from './builders/table.builder';
import { buildFooter, buildHeader } from './templates/header.tpl';
import { SXG_HELPERS_PRW } from './templates/helpers.advpl';
import type { BuildResult, MigrationInput, MigrationItemInput, ValidationError } from './types';
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

  const functionName = buildMigrationFunctionName(migrationInput.sequence, migrationInput.items);

  const header = buildHeader(migrationInput, functionName);
  const footer = buildFooter(migrationInput);

  const tableSections = migrationInput.items
    .filter((item) => item.targetType === 'TABLE')
    .map((item) => {
      switch (item.operation) {
        case 'CREATE_TABLE':
          return buildTableCreation(item);
        case 'ALTER_TABLE':
          return buildTableAlteration(item);
        case 'DROP_TABLE':
          return buildTableDeletion(item);
        default:
          return '';
      }
    })
    .filter((section) => section.length > 0);

  const fieldSections = migrationInput.items
    .filter((item) => item.targetType === 'FIELD')
    .map((item) => {
      switch (item.operation) {
        case 'CREATE_FIELD':
          return buildFieldCreation(item);
        case 'ALTER_FIELD':
          return buildFieldAlteration(item);
        case 'DROP_FIELD':
          return buildFieldDeletion(item);
        default:
          return '';
      }
    })
    .filter((section) => section.length > 0);

  const indexSections = migrationInput.items
    .filter((item) => item.targetType === 'INDEX')
    .map((item) => {
      switch (item.operation) {
        case 'CREATE_INDEX':
          return buildIndexCreation(item);
        case 'ALTER_INDEX':
          return buildIndexAlteration(item);
        case 'DROP_INDEX':
          return buildIndexDeletion(item);
        default:
          return '';
      }
    })
    .filter((section) => section.length > 0);

  const body = [
    `User Function ${functionName}()`,
    `    Local aTabela := {}`,
    `    Local aCampo := {}`,
    `    Local aIndice := {}`,
    ...(tableSections.length > 0
      ? ['', ...tableSections]
      : ['    // Nenhuma operação SX2 nesta migration']),
    ...(fieldSections.length > 0
      ? ['', ...fieldSections]
      : ['    // Nenhuma operação SX3 nesta migration']),
    ...(indexSections.length > 0
      ? ['', ...indexSections]
      : ['    // Nenhuma operação SIX nesta migration']),
  ].join('\n');

  return [header, body, footer].join('\n\n');
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
  return {
    code,
    helperCode: SXG_HELPERS_PRW,
    warnings: [],
  };
}

export function buildMigrationFunctionName(sequence: number, items: MigrationItemInput[]): string {
  const seq = String(sequence).padStart(3, '0');
  const first = items[0];
  if (!first) return `SXG${seq}Migration`;

  const action = mapOperationAction(first.operation);
  const target = normalizeFunctionToken(first.targetName);
  return `SXG${seq}${action}${target}`;
}

function mapOperationAction(operation: MigrationItemInput['operation']): string {
  switch (operation) {
    case 'CREATE_TABLE':
    case 'CREATE_FIELD':
    case 'CREATE_INDEX':
      return 'Cria';
    case 'ALTER_TABLE':
    case 'ALTER_FIELD':
    case 'ALTER_INDEX':
      return 'Altera';
    case 'DROP_TABLE':
    case 'DROP_FIELD':
    case 'DROP_INDEX':
      return 'Drop';
    default:
      return 'Exec';
  }
}

function normalizeFunctionToken(token: string): string {
  const normalized = token.replace(/[^A-Za-z0-9]/g, '');
  if (!normalized) return 'Migration';
  return normalized[0].toUpperCase() + normalized.slice(1);
}
