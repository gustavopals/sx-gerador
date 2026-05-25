import { decodeX3Usado, type UsadoFlags } from '@sxgerador/advpl-builder';
import type { ContextMode, CsvFieldDraft, FieldType, OwnerType, VisualMode } from '../types';
import { emptyToNull, pick, pickInt, pickYesNo } from '../utils';

function pickType(row: Record<string, string>): FieldType {
  const raw = pick(row, 'X3_TIPO', 'TIPO').toUpperCase();
  if (raw === 'C' || raw === 'N' || raw === 'D' || raw === 'M' || raw === 'L') return raw;
  return 'C';
}

function pickVisual(row: Record<string, string>): VisualMode {
  const raw = pick(row, 'X3_VISUAL', 'VISUAL').toUpperCase();
  if (raw === 'V' || raw === 'A' || raw === 'R') return raw;
  return 'A';
}

function pickContext(row: Record<string, string>): ContextMode {
  const raw = pick(row, 'X3_CONTEXT', 'CONTEXT').toUpperCase();
  if (raw === 'R' || raw === 'V') return raw;
  return 'R';
}

function pickOwner(row: Record<string, string>): OwnerType {
  const raw = pick(row, 'X3_PROPRI', 'PROPRI').toUpperCase();
  if (raw === 'U' || raw === 'S') return raw;
  return 'U';
}

function decodeUsadoFromRow(row: Record<string, string>): Record<string, boolean> {
  const encoded = pick(row, 'X3_USADO', 'USADO');
  if (!encoded) return {};
  try {
    const flags = decodeX3Usado(encoded) as UsadoFlags;
    return { ...flags };
  } catch {
    return {};
  }
}

export function mapSx3Row(
  row: Record<string, string>,
): { prefix: string; field: CsvFieldDraft } | null {
  const prefix = pick(row, 'X3_ARQUIVO', 'ARQUIVO', 'X2_CHAVE').toUpperCase();
  const name = pick(row, 'X3_CAMPO', 'CAMPO').toUpperCase();
  if (!prefix || prefix.length !== 3 || !name) return null;

  const orderRaw = pick(row, 'X3_ORDEM', 'ORDEM');
  const order = orderRaw ? orderRaw.padStart(2, '0').slice(-2) : '01';

  const titlePt = pick(row, 'X3_TITULO', 'TITULO') || name.slice(4) || name;
  const descPt = pick(row, 'X3_DESCRIC', 'DESCRIC', 'DESCRICAO') || titlePt;

  const modulesBitmap = pickInt(row, 0, 'X3_MODULO', 'MODULO');

  return {
    prefix,
    field: {
      name,
      order,
      type: pickType(row),
      size: pickInt(row, 1, 'X3_TAMANHO', 'TAMANHO'),
      decimals: pickInt(row, 0, 'X3_DECIMAL', 'DECIMAL'),
      titlePt,
      titleEs: emptyToNull(pick(row, 'X3_TITSPA', 'TITSPA')),
      titleEn: emptyToNull(pick(row, 'X3_TITENG', 'TITENG')),
      descPt,
      descEs: emptyToNull(pick(row, 'X3_DESCSPA', 'DESCSPA')),
      descEn: emptyToNull(pick(row, 'X3_DESCENG', 'DESCENG')),
      picture: emptyToNull(pick(row, 'X3_PICTURE', 'PICTURE')),
      pictureVar: emptyToNull(pick(row, 'X3_PICTVAR', 'PICTVAR')),
      pictureBrowse: emptyToNull(pick(row, 'X3_PICBRV', 'PICBRV')),
      validation: emptyToNull(pick(row, 'X3_VALID', 'VALID')),
      userValidation: emptyToNull(pick(row, 'X3_VLDUSER', 'VLDUSER')),
      defaultRel: emptyToNull(pick(row, 'X3_RELACAO', 'RELACAO')),
      whenExpr: emptyToNull(pick(row, 'X3_WHEN', 'WHEN')),
      initBrowse: emptyToNull(pick(row, 'X3_INIBRW', 'INIBRW')),
      comboPt: emptyToNull(pick(row, 'X3_CBOX', 'CBOX')),
      comboEs: emptyToNull(pick(row, 'X3_CBOXSPA', 'CBOXSPA')),
      comboEn: emptyToNull(pick(row, 'X3_CBOXENG', 'CBOXENG')),
      searchKey: emptyToNull(pick(row, 'X3_F3', 'F3')),
      visualMode: pickVisual(row),
      contextMode: pickContext(row),
      owner: pickOwner(row),
      required: emptyToNull(pick(row, 'X3_OBRIGAT', 'OBRIGAT')),
      showBrowse: pickYesNo(row, 'S', 'X3_BROWSE', 'BROWSE'),
      hasCheck: pickYesNo(row, 'N', 'X3_CHECK', 'CHECK'),
      hasTrigger: pickYesNo(row, 'N', 'X3_TRIGGER', 'TRIGGER'),
      level: pickInt(row, 0, 'X3_NIVEL', 'NIVEL'),
      pyme: pickYesNo(row, 'N', 'X3_PYME', 'PYME'),
      serverIndex: pickYesNo(row, 'N', 'X3_IDXSRV', 'IDXSRV'),
      fieldIndex: pickYesNo(row, 'N', 'X3_IDXFLD', 'IDXFLD'),
      spelling: pickYesNo(row, 'N', 'X3_ORTOGRA', 'ORTOGRA'),
      modal: pickYesNo(row, 'N', 'X3_MODAL', 'MODAL'),
      positionLogix: pickYesNo(row, 'N', 'X3_POSLGT', 'POSLGT'),
      usadoFlags: decodeUsadoFromRow(row),
      modulesFlags: { bitmap: modulesBitmap },
      sqlCondition: emptyToNull(pick(row, 'X3_CONDSQL', 'CONDSQL')),
      sqlCheck: emptyToNull(pick(row, 'X3_CHKSQL', 'CHKSQL')),
      groupSxg: emptyToNull(pick(row, 'X3_GRPSXG', 'GRPSXG')),
      folder: emptyToNull(pick(row, 'X3_FOLDER', 'FOLDER')),
      screen: emptyToNull(pick(row, 'X3_TELA', 'TELA')),
      grouping: emptyToNull(pick(row, 'X3_AGRUP', 'AGRUP')),
      reserved: emptyToNull(pick(row, 'X3_RESERV', 'RESERV')),
      notes: null,
    },
  };
}
