export interface FieldNameValidationResult {
  valid: boolean;
  errors: string[];
}

const TABLE_PREFIX_PATTERN = /^[A-Z0-9]{3}$/;
const FIELD_NAME_PATTERN = /^[A-Z0-9]{3}_[A-Z0-9_]+$/;
const MAX_FIELD_NAME_LENGTH = 10;

export function validateFieldName(name: string, tablePrefix: string): FieldNameValidationResult {
  const errors: string[] = [];

  if (typeof tablePrefix !== 'string' || tablePrefix.length === 0) {
    errors.push('Prefixo da tabela é obrigatório.');
    return { valid: false, errors };
  }

  if (!TABLE_PREFIX_PATTERN.test(tablePrefix)) {
    errors.push('Prefixo da tabela deve ter exatamente 3 caracteres A-Z/0-9.');
    return { valid: false, errors };
  }

  if (typeof name !== 'string' || name.length === 0) {
    errors.push('Nome do campo é obrigatório.');
    return { valid: false, errors };
  }

  if (name !== name.toUpperCase()) {
    errors.push('Nome do campo deve estar em maiúsculas.');
  }

  if (name.length > MAX_FIELD_NAME_LENGTH) {
    errors.push(`Nome do campo deve ter no máximo ${MAX_FIELD_NAME_LENGTH} caracteres.`);
  }

  if (!FIELD_NAME_PATTERN.test(name)) {
    errors.push(
      'Nome do campo deve seguir o padrão PREFIXO_NOME usando apenas A-Z, 0-9 e underscore.',
    );
    return { valid: false, errors };
  }

  if (!name.startsWith(`${tablePrefix}_`)) {
    errors.push(`Nome do campo deve começar com "${tablePrefix}_".`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
