import { encodeX3Usado, type UsadoFlags } from '../encoders/x3-usado.encoder';
import type { MigrationItemInput } from '../types';

interface FieldState {
  name: string;
  order?: string;
  type?: string;
  size?: number;
  decimals?: number;
  titlePt?: string;
  titleEs?: string | null;
  titleEn?: string | null;
  descPt?: string;
  descEs?: string | null;
  descEn?: string | null;
  picture?: string | null;
  validation?: string | null;
  defaultRel?: string | null;
  level?: number;
  owner?: 'U' | 'S';
  showBrowse?: 'S' | 'N';
  visualMode?: 'V' | 'A' | 'R';
  contextMode?: 'R' | 'V';
  usadoFlags?: unknown;
}

/**
 * Gera o bloco AdvPL de criação de um campo (SX3).
 *
 * @param _item - Item da migration com afterState contendo dados do campo
 * @returns Trecho AdvPL para criação de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldCreation(item: MigrationItemInput): string {
  const after = parseFieldState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SX3 - Criação do campo ${after.name}`,
    `    // ========================================================================`,
    buildSx3(after),
    `    U_SXGCriaSX3(aCampo)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de alteração de um campo (SX3).
 *
 * @param _item - Item da migration com before/afterState
 * @returns Trecho AdvPL para alteração de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldAlteration(item: MigrationItemInput): string {
  const after = parseFieldState(item.afterState, 'afterState');
  return [
    `    // ========================================================================`,
    `    // SX3 - Alteração do campo ${after.name}`,
    `    // ========================================================================`,
    buildSx3(after),
    `    U_SXGCriaSX3(aCampo)`,
  ].join('\n');
}

/**
 * Gera o bloco AdvPL de exclusão de um campo (SX3).
 *
 * @param _item - Item da migration com beforeState contendo dados do campo
 * @returns Trecho AdvPL para exclusão de campo
 * @todo Implementar na Task F6.3
 */
export function buildFieldDeletion(item: MigrationItemInput): string {
  const before = parseFieldState(item.beforeState, 'beforeState');
  return [
    `    // ========================================================================`,
    `    // SX3 - Exclusão do campo ${before.name}`,
    `    // ========================================================================`,
    `    U_SXGDropSX3("${escapeAdvplString(before.name)}")`,
  ].join('\n');
}

export function buildSx3(field: FieldState): string {
  const encodedUsado = resolveUsadoEncoded(field.usadoFlags);
  return [
    `    aCampo := {;`,
    `        "${escapeAdvplString(field.name)}" ,;  // X3_CAMPO`,
    `        "${escapeAdvplString(field.order ?? '01')}" ,;  // X3_ORDEM`,
    `        "${escapeAdvplString(field.type ?? 'C')}" ,;  // X3_TIPO`,
    `        ${field.size ?? 10} ,;  // X3_TAMANHO`,
    `        ${field.decimals ?? 0} ,;  // X3_DECIMAL`,
    `        "${escapeAdvplString(field.titlePt ?? field.name)}" ,;  // X3_TITULO`,
    `        "${escapeAdvplString(field.titleEs ?? '')}" ,;  // X3_TITSPA`,
    `        "${escapeAdvplString(field.titleEn ?? '')}" ,;  // X3_TITENG`,
    `        "${escapeAdvplString(field.descPt ?? field.name)}" ,;  // X3_DESCRIC`,
    `        "${escapeAdvplString(field.descEs ?? '')}" ,;  // X3_DESCSPA`,
    `        "${escapeAdvplString(field.descEn ?? '')}" ,;  // X3_DESCENG`,
    `        "${escapeAdvplString(field.picture ?? '')}" ,;  // X3_PICTURE`,
    `        "${escapeAdvplString(field.validation ?? '')}" ,;  // X3_VALID`,
    `        "${escapeAdvplString(encodedUsado)}" ,;  // X3_USADO`,
    `        "${escapeAdvplString(field.defaultRel ?? '')}" ,;  // X3_RELACAO`,
    `        ${field.level ?? 0} ,;  // X3_NIVEL`,
    `        "${escapeAdvplString(field.owner ?? 'U')}" ,;  // X3_PROPRI`,
    `        "${escapeAdvplString(field.showBrowse ?? 'S')}" ,;  // X3_BROWSE`,
    `        "${escapeAdvplString(field.visualMode ?? 'A')}" ,;  // X3_VISUAL`,
    `        "${escapeAdvplString(field.contextMode ?? 'R')}" ;   // X3_CONTEXT`,
    `    }`,
  ].join('\n');
}

function parseFieldState(
  value: Record<string, unknown> | null,
  stateLabel: 'beforeState' | 'afterState',
): FieldState {
  if (!value || typeof value !== 'object') {
    throw new Error(`Campo inválido: ${stateLabel} ausente ou mal formatado`);
  }

  const raw = value as Partial<FieldState> & Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    throw new Error(`Campo inválido: name ausente em ${stateLabel}`);
  }

  return {
    name,
    order: toOptionalString(raw.order),
    type: toOptionalString(raw.type),
    size: toOptionalNumber(raw.size),
    decimals: toOptionalNumber(raw.decimals),
    titlePt: toOptionalString(raw.titlePt),
    titleEs: toOptionalNullableString(raw.titleEs),
    titleEn: toOptionalNullableString(raw.titleEn),
    descPt: toOptionalString(raw.descPt),
    descEs: toOptionalNullableString(raw.descEs),
    descEn: toOptionalNullableString(raw.descEn),
    picture: toOptionalNullableString(raw.picture),
    validation: toOptionalNullableString(raw.validation),
    defaultRel: toOptionalNullableString(raw.defaultRel),
    level: toOptionalNumber(raw.level),
    owner: toOptionalOwner(raw.owner),
    showBrowse: toOptionalYesNo(raw.showBrowse),
    visualMode: toOptionalVisualMode(raw.visualMode),
    contextMode: toOptionalContextMode(raw.contextMode),
    usadoFlags: raw.usadoFlags,
  };
}

function resolveUsadoEncoded(usadoFlags: unknown): string {
  if (!usadoFlags || typeof usadoFlags !== 'object') return encodeX3Usado(emptyUsadoFlags());

  const encoded = (usadoFlags as Record<string, unknown>)['encoded'];
  if (typeof encoded === 'string' && encoded.length > 0) return encoded;

  if (isUsadoFlagsObject(usadoFlags)) return encodeX3Usado(usadoFlags);
  return encodeX3Usado(emptyUsadoFlags());
}

function emptyUsadoFlags(): UsadoFlags {
  return {
    visible: false,
    browse: false,
    query: false,
    canChange: false,
    required: false,
    virtual: false,
    noPrint: false,
    blocked: false,
    noGet: false,
    restricted: false,
    memo: false,
    noTrigger: false,
  };
}

function isUsadoFlagsObject(value: unknown): value is UsadoFlags {
  if (!value || typeof value !== 'object') return false;
  const flags = value as Record<string, unknown>;
  return (
    typeof flags['visible'] === 'boolean' &&
    typeof flags['browse'] === 'boolean' &&
    typeof flags['query'] === 'boolean' &&
    typeof flags['canChange'] === 'boolean' &&
    typeof flags['required'] === 'boolean' &&
    typeof flags['virtual'] === 'boolean' &&
    typeof flags['noPrint'] === 'boolean' &&
    typeof flags['blocked'] === 'boolean' &&
    typeof flags['noGet'] === 'boolean' &&
    typeof flags['restricted'] === 'boolean' &&
    typeof flags['memo'] === 'boolean' &&
    typeof flags['noTrigger'] === 'boolean'
  );
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

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return value;
}

function toOptionalOwner(value: unknown): 'U' | 'S' | undefined {
  if (value === 'U' || value === 'S') return value;
  return undefined;
}

function toOptionalYesNo(value: unknown): 'S' | 'N' | undefined {
  if (value === 'S' || value === 'N') return value;
  return undefined;
}

function toOptionalVisualMode(value: unknown): 'V' | 'A' | 'R' | undefined {
  if (value === 'V' || value === 'A' || value === 'R') return value;
  return undefined;
}

function toOptionalContextMode(value: unknown): 'R' | 'V' | undefined {
  if (value === 'R' || value === 'V') return value;
  return undefined;
}

function escapeAdvplString(value: string): string {
  return value.replaceAll('"', "'");
}
