import type { CsvTableDraft } from '../types';
import { emptyToNull, pick, pickInt, pickSharing, pickYesNo } from '../utils';

export function mapSx2Row(row: Record<string, string>): CsvTableDraft | null {
  const prefix = pick(row, 'X2_CHAVE', 'CHAVE').toUpperCase();
  if (!prefix || prefix.length !== 3) return null;

  const fileName = pick(row, 'X2_ARQUIVO', 'ARQUIVO') || `${prefix}010`;
  const namePt = pick(row, 'X2_NOME', 'NOME') || prefix;

  return {
    prefix,
    fileName: fileName.length === 8 ? fileName : `${prefix}010`,
    namePt,
    nameEs: emptyToNull(pick(row, 'X2_NOMESPA', 'NOMESPA')),
    nameEn: emptyToNull(pick(row, 'X2_NOMEENG', 'NOMEENG')),
    routine: emptyToNull(pick(row, 'X2_ROTINA', 'ROTINA')),
    modeCompany: pickSharing(row, 'C', 'X2_MODO', 'MODO'),
    modeUnit: pickSharing(row, 'C', 'X2_MODOUN', 'MODOUN'),
    modeBranch: pickSharing(row, 'C', 'X2_MODOEMP', 'MODOEMP'),
    ttsEnabled: pickYesNo(row, 'S', 'X2_TTS', 'TTS'),
    uniqueKey: emptyToNull(pick(row, 'X2_UNICO', 'UNICO')),
    pyme: pickYesNo(row, 'N', 'X2_PYME', 'PYME'),
    modules: pickInt(row, 0, 'X2_MODULO', 'MODULO'),
    hasClob: pickYesNo(row, 'N', 'X2_CLOB', 'CLOB'),
    autoIncRec: pickYesNo(row, 'N', 'X2_AUTREC', 'AUTREC'),
    tamFil: pickInt(row, 2, 'X2_TAMFIL', 'TAMFIL'),
    tamUn: pickInt(row, 2, 'X2_TAMUN', 'TAMUN'),
    tamEmp: pickInt(row, 2, 'X2_TAMEMP', 'TAMEMP'),
    notes: null,
    fields: [],
    indexes: [],
  };
}
