/**
 * Encoder para o campo X2_MODULO do dicionário SX2.
 *
 * X2_MODULO é um bitmap que indica em quais módulos Protheus
 * a tabela está disponível (Faturamento, Compras, Estoque, etc.).
 *
 * Implementação completa na Task F4.2.
 */

export const PROTHEUS_MODULES = [
  'FA', // Faturamento
  'CO', // Compras
  'EST', // Estoque
  'FIN', // Financeiro
  'CTB', // Contabilidade
  'PCP', // PCP
  'RH', // Recursos Humanos
  'MNT', // Manutenção
  'CRM', // CRM
  'EXP', // Exportação
] as const;

export type ProtheusModule = (typeof PROTHEUS_MODULES)[number];

/**
 * Codifica lista de módulos no bitmap X2_MODULO.
 *
 * @param _modules - Módulos habilitados
 * @returns String bitmap no formato Protheus
 * @todo Implementar na Task F4.2
 */
export function encodeX2Modulo(_modules: ProtheusModule[]): string {
  // TODO (Task F4.2): implementar encoding real
  throw new Error('encodeX2Modulo: não implementado ainda (Task F4.2)');
}

/**
 * Decodifica o bitmap X2_MODULO em lista de módulos.
 *
 * @param _encoded - String bitmap no formato Protheus
 * @returns Lista de módulos habilitados
 * @todo Implementar na Task F4.2
 */
export function decodeX2Modulo(_encoded: string): ProtheusModule[] {
  // TODO (Task F4.2): implementar decoding real
  throw new Error('decodeX2Modulo: não implementado ainda (Task F4.2)');
}
