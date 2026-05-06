export interface IndexKeyFieldsValidationResult {
  valid: boolean;
  errors: string[];
  referencedFields: string[];
}

const FIELD_TOKEN_PATTERN = /^[A-Z0-9_]+$/;
const SPECIAL_TOKEN_PATTERN = /^(xFilial\('[A-Z0-9]{3}'\)|DTOS\(Date\(\)\)|StrZero\(\d+,\d+\))$/;

/**
 * Valida se a chave do indice referencia somente campos existentes na tabela.
 */
export function validateIndexKeyFields(
  keyExpression: string,
  availableFieldNames: string[],
): IndexKeyFieldsValidationResult {
  const errors: string[] = [];

  if (typeof keyExpression !== 'string' || keyExpression.trim().length === 0) {
    errors.push('Chave do índice é obrigatória.');
    return { valid: false, errors, referencedFields: [] };
  }

  const referencedFields = keyExpression
    .split('+')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (referencedFields.length === 0) {
    errors.push('Chave do índice deve conter ao menos um campo.');
    return { valid: false, errors, referencedFields: [] };
  }

  if (
    referencedFields.some(
      (token) => !FIELD_TOKEN_PATTERN.test(token) && !SPECIAL_TOKEN_PATTERN.test(token),
    )
  ) {
    errors.push('Chave do índice deve conter apenas nomes de campos válidos separados por "+".');
    return { valid: false, errors, referencedFields };
  }

  const availableSet = new Set(availableFieldNames);
  const unknownFields = referencedFields.filter(
    (token) => FIELD_TOKEN_PATTERN.test(token) && !availableSet.has(token),
  );

  if (unknownFields.length > 0) {
    errors.push(`A chave do índice referencia campos inexistentes: ${unknownFields.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    referencedFields,
  };
}
