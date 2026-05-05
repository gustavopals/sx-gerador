/**
 * Encoder para o campo X3_USADO do dicionário SX3.
 *
 * X3_USADO é um bitmap de 120 caracteres no charset Protheus que codifica
 * flags de visibilidade e comportamento do campo por módulo.
 *
 * Implementação completa na Task F4.2.
 */

export interface UsadoFlags {
  visible: boolean;
  browse: boolean;
  query: boolean;
  canChange: boolean;
  required: boolean;
  virtual: boolean;
  noPrint: boolean;
  blocked: boolean;
  noGet: boolean;
  restricted: boolean;
  memo: boolean;
  noTrigger: boolean;
}

/**
 * Codifica flags de X3_USADO no formato bitmap Protheus (120 chars).
 *
 * @param _flags - Flags de uso do campo por módulo
 * @returns String de 120 caracteres no charset Protheus
 * @todo Implementar na Task F4.2
 */
export function encodeX3Usado(_flags: UsadoFlags): string {
  // TODO (Task F4.2): implementar encoding real com charset Protheus
  throw new Error('encodeX3Usado: não implementado ainda (Task F4.2)');
}

/**
 * Decodifica o bitmap X3_USADO de volta para flags legíveis.
 *
 * @param _encoded - String de 120 chars no charset Protheus
 * @returns Flags decodificadas
 * @todo Implementar na Task F4.2
 */
export function decodeX3Usado(_encoded: string): UsadoFlags {
  // TODO (Task F4.2): implementar decoding real
  throw new Error('decodeX3Usado: não implementado ainda (Task F4.2)');
}
