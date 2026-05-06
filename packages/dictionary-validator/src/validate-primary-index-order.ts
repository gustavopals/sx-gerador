export interface PrimaryIndexOrderValidationInput {
  existingOrders: string[];
  order: string;
  currentOrder?: string;
}

export interface PrimaryIndexOrderValidationResult {
  valid: boolean;
  errors: string[];
}

const PRIMARY_INDEX_ORDER = '1';

/**
 * Valida a regra do Protheus onde apenas um indice de ordem 1
 * pode existir por tabela.
 */
export function validatePrimaryIndexOrder(
  input: PrimaryIndexOrderValidationInput,
): PrimaryIndexOrderValidationResult {
  const errors: string[] = [];
  const normalizedOrder = input.order?.trim();
  const normalizedCurrentOrder = input.currentOrder?.trim();

  if (!normalizedOrder) {
    errors.push('Ordem do indice é obrigatória.');
    return { valid: false, errors };
  }

  if (normalizedOrder !== PRIMARY_INDEX_ORDER) {
    return { valid: true, errors };
  }

  const existingPrimaryCount = input.existingOrders
    .map((order) => order.trim())
    .filter((order) => order === PRIMARY_INDEX_ORDER).length;

  const effectivePrimaryCount =
    normalizedCurrentOrder === PRIMARY_INDEX_ORDER
      ? existingPrimaryCount - 1
      : existingPrimaryCount;

  if (effectivePrimaryCount > 0) {
    errors.push(
      'A tabela já possui um índice de ordem 1. Só é permitido um índice principal por tabela.',
    );
  }

  return { valid: errors.length === 0, errors };
}
