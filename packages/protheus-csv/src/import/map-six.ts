import type { CsvIndexDraft, OwnerType } from '../types';
import { emptyToNull, pick, pickYesNo } from '../utils';

function pickOwner(row: Record<string, string>): OwnerType {
  const raw = pick(row, 'PROPRI', 'X3_PROPRI').toUpperCase();
  if (raw === 'U' || raw === 'S') return raw;
  return 'U';
}

export function mapSixRow(
  row: Record<string, string>,
): { prefix: string; index: CsvIndexDraft } | null {
  const prefix = pick(row, 'INDICE', 'X2_CHAVE', 'ARQUIVO').toUpperCase();
  const key = pick(row, 'CHAVE');
  const order = pick(row, 'ORDEM');
  if (!prefix || prefix.length !== 3 || !key || !order) return null;

  const descPt = pick(row, 'DESCRICAO', 'DESC') || `Indice ${order}`;

  return {
    prefix,
    index: {
      order: order.trim(),
      key: key.trim(),
      descPt,
      descEs: emptyToNull(pick(row, 'DESCSPA')),
      descEn: emptyToNull(pick(row, 'DESCENG')),
      owner: pickOwner(row),
      searchExpr: emptyToNull(pick(row, 'F3')),
      nickname: emptyToNull(pick(row, 'NICKNAME')),
      showSearch: pickYesNo(row, 'S', 'SHOWPESQ'),
      isVirtual: pickYesNo(row, 'N', 'IX_VIRTUAL'),
      virtualCustomizable: pickYesNo(row, 'N', 'IX_VIRCUST'),
      notes: null,
    },
  };
}
