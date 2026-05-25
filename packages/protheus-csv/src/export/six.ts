import { formatCsv } from '../csv/format';
import type { ExportProjectSnapshot } from '../types';

const SIX_HEADERS = [
  'INDICE',
  'ORDEM',
  'CHAVE',
  'DESCRICAO',
  'DESCSPA',
  'DESCENG',
  'PROPRI',
  'F3',
  'NICKNAME',
  'SHOWPESQ',
  'IX_VIRTUAL',
  'IX_VIRCUST',
] as const;

export function exportSixCsv(snapshot: ExportProjectSnapshot): string {
  const rows: string[][] = [];
  for (const table of snapshot.tables) {
    for (const ix of table.indexes) {
      rows.push([
        table.prefix,
        ix.order,
        ix.key,
        ix.descPt,
        ix.descEs ?? '',
        ix.descEn ?? '',
        ix.owner,
        ix.searchExpr ?? '',
        ix.nickname ?? '',
        ix.showSearch,
        ix.isVirtual,
        ix.virtualCustomizable,
      ]);
    }
  }
  return formatCsv([...SIX_HEADERS], rows);
}
