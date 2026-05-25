import { formatCsv } from '../csv/format';
import type { ExportProjectSnapshot } from '../types';

const SX2_HEADERS = [
  'X2_CHAVE',
  'X2_ARQUIVO',
  'X2_NOME',
  'X2_NOMESPA',
  'X2_NOMEENG',
  'X2_ROTINA',
  'X2_MODO',
  'X2_MODOUN',
  'X2_MODOEMP',
  'X2_TTS',
  'X2_UNICO',
  'X2_PYME',
  'X2_MODULO',
  'X2_CLOB',
  'X2_AUTREC',
  'X2_TAMFIL',
  'X2_TAMUN',
  'X2_TAMEMP',
] as const;

export function exportSx2Csv(snapshot: ExportProjectSnapshot): string {
  const rows = snapshot.tables.map((t) => [
    t.prefix,
    t.fileName,
    t.namePt,
    t.nameEs ?? '',
    t.nameEn ?? '',
    t.routine ?? '',
    t.modeCompany,
    t.modeUnit,
    t.modeBranch,
    t.ttsEnabled,
    t.uniqueKey ?? '',
    t.pyme,
    String(t.modules),
    t.hasClob,
    t.autoIncRec,
    String(t.tamFil),
    String(t.tamUn),
    String(t.tamEmp),
  ]);
  return formatCsv([...SX2_HEADERS], rows);
}
