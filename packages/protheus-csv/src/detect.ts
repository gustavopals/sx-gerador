import { normalizeHeader } from './csv/parse';
import type { DictionaryKind } from './types';

export function detectDictionaryKind(headers: string[]): DictionaryKind | null {
  const set = new Set(headers.map(normalizeHeader));
  if (set.has('INDICE') && set.has('CHAVE') && set.has('ORDEM')) return 'six';
  if (set.has('X3_CAMPO') || set.has('X3_ARQUIVO')) return 'sx3';
  if (set.has('X2_CHAVE') || set.has('X2_ARQUIVO')) return 'sx2';
  return null;
}

export function detectDictionaryKindFromCsv(text: string): DictionaryKind | null {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/)[0] ?? '';
  if (!firstLine.trim()) return null;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const delimiter = semicolons >= commas ? ';' : ',';
  const headers = firstLine.split(delimiter).map((h) => normalizeHeader(h.replace(/^"|"$/g, '')));
  return detectDictionaryKind(headers);
}
