/**
 * Encoder para o campo X2_MODULO do dicionário SX2.
 *
 * X2_MODULO e X3_MODULO são bitmaps numéricos que indicam em quais módulos
 * Protheus a tabela/campo está disponível.
 */

export const PROTHEUS_MODULES = [
  'SIGAFAT', // Faturamento
  'SIGAEST', // Estoque e Custos
  'SIGACOM', // Compras
  'SIGAFIN', // Financeiro
  'SIGAGPE', // Gestão de Pessoal
  'SIGAMNT', // Manutenção
  'SIGAATF', // Ativo Fixo
  'SIGAOFE', // Manufatura
  'SIGATMS', // Transportes
  'SIGACRM', // CRM
  'SIGAHOSP', // Hospitalar
  'SIGAPLS', // Plano de Saúde
] as const;

export type ProtheusModule = (typeof PROTHEUS_MODULES)[number];

const MODULE_BITS: Record<ProtheusModule, number> = {
  SIGAFAT: 0,
  SIGAEST: 1,
  SIGACOM: 2,
  SIGAFIN: 3,
  SIGAGPE: 4,
  SIGAMNT: 5,
  SIGAATF: 6,
  SIGAOFE: 7,
  SIGATMS: 8,
  SIGACRM: 9,
  SIGAHOSP: 10,
  SIGAPLS: 11,
};

/**
 * Codifica lista de módulos no bitmap X2_MODULO.
 *
 * @param modules - Módulos habilitados
 * @returns Bitmap numérico no formato Protheus
 */
export function encodeX2Modulo(modules: readonly ProtheusModule[]): number {
  if (!Array.isArray(modules)) {
    throw new TypeError('Módulos de X2_MODULO devem ser um array.');
  }

  return modules.reduce((bitmap, module) => bitmap | moduleToMask(module), 0);
}

/**
 * Decodifica o bitmap X2_MODULO em lista de módulos.
 *
 * @param encoded - Bitmap numérico no formato Protheus
 * @returns Lista de módulos habilitados
 */
export function decodeX2Modulo(encoded: number | string): ProtheusModule[] {
  const bitmap = parseModuloBitmap(encoded);

  return PROTHEUS_MODULES.filter((module) => (bitmap & moduleToMask(module)) !== 0);
}

export const encodeX3Modulo = encodeX2Modulo;
export const decodeX3Modulo = decodeX2Modulo;

function moduleToMask(module: ProtheusModule): number {
  const bit = MODULE_BITS[module];

  if (bit === undefined) {
    throw new Error(`Módulo Protheus desconhecido: ${String(module)}.`);
  }

  return 1 << bit;
}

function parseModuloBitmap(encoded: number | string): number {
  const bitmap = typeof encoded === 'string' ? Number(encoded.trim()) : encoded;

  if (!Number.isInteger(bitmap) || bitmap < 0) {
    throw new Error('Bitmap X2_MODULO deve ser um inteiro não negativo.');
  }

  return bitmap;
}
