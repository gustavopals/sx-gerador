import type { MigrationItemInput } from '../types';

interface IndexState {
  order: string;
  key: string;
  descPt?: string;
  descEs?: string | null;
  descEn?: string | null;
  owner?: 'U' | 'S';
  searchExpr?: string | null;
  nickname?: string | null;
  showSearch?: 'S' | 'N';
  isVirtual?: 'S' | 'N';
  virtualCustomizable?: 'S' | 'N';
}

/**
 * Gera o bloco AdvPL de criação de um índice (SIX).
 *
 * @param _item - Item da migration com afterState contendo dados do índice
 * @returns Trecho AdvPL para criação de índice
 * @todo Implementar na Task F6.3
 */
export function buildIndexCreation(item: MigrationItemInput): string {
  const after = parseIndexState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SIX - Criação do índice ${after.order}`,
    `    // ========================================================================`,
    buildSix(after),
    `    U_SXGCriaIdx(aIndice)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de alteração de um índice (SIX).
 *
 * @param _item - Item da migration com before/afterState
 * @returns Trecho AdvPL para alteração de índice
 * @todo Implementar na Task F6.3
 */
export function buildIndexAlteration(item: MigrationItemInput): string {
  const after = parseIndexState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SIX - Alteração do índice ${after.order}`,
    `    // ========================================================================`,
    buildSix(after),
    `    U_SXGCriaIdx(aIndice)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de exclusão de um índice (SIX).
 *
 * @param _item - Item da migration com beforeState contendo dados do índice
 * @returns Trecho AdvPL para exclusão de índice
 * @todo Implementar na Task F6.3
 */
export function buildIndexDeletion(item: MigrationItemInput): string {
  const before = parseIndexState(item.beforeState, 'beforeState');
  return [
    `    // ========================================================================`,
    `    // SIX - Exclusão do índice ${before.order}`,
    `    // ========================================================================`,
    `    U_SXGDropIdx("${escapeAdvplString(before.order)}", "${escapeAdvplString(before.key)}")`,
  ].join('\n');
}

export function buildSix(index: IndexState): string {
  return [
    `    aIndice := {;`,
    `        "${escapeAdvplString(index.order)}" ,;  // SIX.ORDEM`,
    `        "${escapeAdvplString(index.key)}" ,;  // SIX.CHAVE`,
    `        "${escapeAdvplString(index.descPt ?? index.key)}" ,;  // SIX.DESCRICAO`,
    `        "${escapeAdvplString(index.descEs ?? '')}" ,;  // SIX.DESCSPA`,
    `        "${escapeAdvplString(index.descEn ?? '')}" ,;  // SIX.DESCENG`,
    `        "${escapeAdvplString(index.owner ?? 'U')}" ,;  // SIX.PROPRI`,
    `        "${escapeAdvplString(index.searchExpr ?? '')}" ,;  // SIX.F3`,
    `        "${escapeAdvplString(index.nickname ?? '')}" ,;  // SIX.NICKNAME`,
    `        "${escapeAdvplString(index.showSearch ?? 'S')}" ,;  // SIX.SHOWPESQ`,
    `        "${escapeAdvplString(index.isVirtual ?? 'N')}" ,;  // SIX.IX_VIRTUAL`,
    `        "${escapeAdvplString(index.virtualCustomizable ?? 'N')}" ;   // SIX.IX_VIRCUST`,
    `    }`,
  ].join('\n');
}

function parseIndexState(
  value: Record<string, unknown> | null,
  stateLabel: 'beforeState' | 'afterState',
): IndexState {
  if (!value || typeof value !== 'object') {
    throw new Error(`Índice inválido: ${stateLabel} ausente ou mal formatado`);
  }

  const raw = value as Partial<IndexState> & Record<string, unknown>;
  const order = typeof raw.order === 'string' ? raw.order.trim() : '';
  const key = typeof raw.key === 'string' ? raw.key.trim() : '';

  if (!order) throw new Error(`Índice inválido: order ausente em ${stateLabel}`);
  if (!key) throw new Error(`Índice inválido: key ausente em ${stateLabel}`);

  return {
    order,
    key,
    descPt: toOptionalString(raw.descPt),
    descEs: toOptionalNullableString(raw.descEs),
    descEn: toOptionalNullableString(raw.descEn),
    owner: toOptionalOwner(raw.owner),
    searchExpr: toOptionalNullableString(raw.searchExpr),
    nickname: toOptionalNullableString(raw.nickname),
    showSearch: toOptionalYesNo(raw.showSearch),
    isVirtual: toOptionalYesNo(raw.isVirtual),
    virtualCustomizable: toOptionalYesNo(raw.virtualCustomizable),
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

function toOptionalOwner(value: unknown): 'U' | 'S' | undefined {
  if (value === 'U' || value === 'S') return value;
  return undefined;
}

function toOptionalYesNo(value: unknown): 'S' | 'N' | undefined {
  if (value === 'S' || value === 'N') return value;
  return undefined;
}

function escapeAdvplString(value: string): string {
  return value.replaceAll('"', "'");
}
