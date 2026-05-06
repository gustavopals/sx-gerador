import type { MigrationItemInput } from '../types';

interface TableState {
  prefix: string;
  fileName?: string;
  namePt?: string;
  nameEs?: string | null;
  nameEn?: string | null;
  modeCompany?: 'C' | 'E';
  ttsEnabled?: 'S' | 'N';
  uniqueKey?: string | null;
}

/**
 * Gera o bloco AdvPL de criação de uma tabela (SX2).
 *
 * @param _item - Item da migration com afterState contendo dados da tabela
 * @returns Trecho AdvPL para criação de tabela
 */
export function buildTableCreation(item: MigrationItemInput): string {
  const after = parseTableState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SX2 - Criação da tabela ${after.prefix}`,
    `    // ========================================================================`,
    buildSx2(after),
    `    U_SXGCriaSX2(aTabela)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de alteração de uma tabela (SX2).
 *
 * @param _item - Item da migration com before/afterState
 * @returns Trecho AdvPL para alteração de tabela
 */
export function buildTableAlteration(item: MigrationItemInput): string {
  const after = parseTableState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SX2 - Alteração da tabela ${after.prefix}`,
    `    // ========================================================================`,
    buildSx2(after),
    `    U_SXGCriaSX2(aTabela)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de exclusão de uma tabela (SX2).
 *
 * @param _item - Item da migration com beforeState contendo dados da tabela
 * @returns Trecho AdvPL para exclusão de tabela
 */
export function buildTableDeletion(item: MigrationItemInput): string {
  const before = parseTableState(item.beforeState, 'beforeState');
  return [
    `    // ========================================================================`,
    `    // SX2 - Exclusão da tabela ${before.prefix}`,
    `    // ========================================================================`,
    `    U_SXGDropSX2("${escapeAdvplString(before.prefix)}")`,
  ].join('\n');
}

/**
 * Gera o trecho de construção do array SX2 (aTabela).
 */
export function buildSx2(table: TableState): string {
  const fileName = table.fileName ?? `${table.prefix}010`;
  const namePt = table.namePt ?? table.prefix;
  const nameEs = table.nameEs ?? '';
  const nameEn = table.nameEn ?? '';
  const modeCompany = table.modeCompany ?? 'C';
  const ttsEnabled = table.ttsEnabled ?? 'S';
  const uniqueKey = table.uniqueKey ?? '';

  return [
    `    aTabela := {;`,
    `        "${escapeAdvplString(table.prefix)}"                 ,;  // X2_CHAVE`,
    `        "${escapeAdvplString(fileName)}"              ,;  // X2_ARQUIVO`,
    `        "${escapeAdvplString(namePt)}" ,;  // X2_NOME`,
    `        "${escapeAdvplString(nameEs)}" ,;  // X2_NOMESPA`,
    `        "${escapeAdvplString(nameEn)}" ,;  // X2_NOMEENG`,
    `        "${escapeAdvplString(modeCompany)}"                   ,;  // X2_MODO`,
    `        "${escapeAdvplString(ttsEnabled)}"                   ,;  // X2_TTS`,
    `        "${escapeAdvplString(uniqueKey)}" ;   // X2_UNICO`,
    `    }`,
  ].join('\n');
}

function parseTableState(
  value: Record<string, unknown> | null,
  stateLabel: 'beforeState' | 'afterState',
): TableState {
  if (!value || typeof value !== 'object') {
    throw new Error(`Tabela inválida: ${stateLabel} ausente ou mal formatado`);
  }

  const raw = value as Partial<TableState> & Record<string, unknown>;
  const prefix = typeof raw.prefix === 'string' ? raw.prefix.trim() : '';
  if (!prefix) {
    throw new Error(`Tabela inválida: prefixo ausente em ${stateLabel}`);
  }

  return {
    prefix,
    fileName: toOptionalString(raw.fileName),
    namePt: toOptionalString(raw.namePt) ?? toOptionalString(raw['name']),
    nameEs: toOptionalNullableString(raw.nameEs),
    nameEn: toOptionalNullableString(raw.nameEn),
    modeCompany: toOptionalMode(raw.modeCompany),
    ttsEnabled: toOptionalYesNo(raw.ttsEnabled),
    uniqueKey: toOptionalNullableString(raw.uniqueKey),
  };
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return toOptionalString(value);
}

function toOptionalMode(value: unknown): 'C' | 'E' | undefined {
  if (value === 'C' || value === 'E') return value;
  return undefined;
}

function toOptionalYesNo(value: unknown): 'S' | 'N' | undefined {
  if (value === 'S' || value === 'N') return value;
  return undefined;
}

function escapeAdvplString(value: string): string {
  return value.replaceAll('"', "'");
}
