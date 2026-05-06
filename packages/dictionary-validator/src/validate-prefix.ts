export interface PrefixValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const PREFIX_PATTERN = /^[A-Z0-9]{3}$/;

export function validatePrefix(prefix: string): PrefixValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof prefix !== 'string' || prefix.length === 0) {
    errors.push('Prefixo é obrigatório.');
    return { valid: false, errors, warnings };
  }

  const upper = prefix.toUpperCase();

  if (upper !== prefix) {
    errors.push('Prefixo deve estar em maiúsculas.');
  }

  if (!PREFIX_PATTERN.test(prefix)) {
    if (prefix.length !== 3) {
      errors.push('Prefixo deve ter exatamente 3 caracteres.');
    } else {
      errors.push('Prefixo deve conter apenas letras A-Z e dígitos 0-9.');
    }
  }

  if (errors.length === 0 && !prefix.startsWith('Z')) {
    warnings.push(
      'Prefixo não começa com "Z". Prefixos customizados devem começar com Z para evitar conflito com tabelas TOTVS.',
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}
