import type { MigrationInput, ValidationError } from '../types';

/**
 * Valida as pré-condições bloqueantes para geração de uma migration.
 *
 * Regras bloqueantes (seção 14.4 do IDEIA.md):
 * 1. Toda tabela criada deve ter pelo menos 1 índice com ordem 1.
 * 2. Toda tabela deve ter campo <PREFIX>_FILIAL.
 * 3. Nome de campo deve seguir o padrão <PREFIX>_*.
 * 4. Tipo N com decimais > 0 deve ter tamanho > decimais.
 * 5. Combobox só faz sentido com tipo C ou N.
 *
 * Implementação completa na Task F6.2.
 *
 * @param _input - Dados da migration a validar
 * @returns Lista de erros bloqueantes (vazia = válido)
 * @todo Implementar na Task F6.2
 */
export function validateMigration(_input: MigrationInput): ValidationError[] {
  // TODO (Task F6.2): implementar validações reais
  return [];
}
