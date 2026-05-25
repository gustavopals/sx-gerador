import { encodeX3Usado, type UsadoFlags } from '@sxgerador/advpl-builder';
import { formatCsv } from '../csv/format';
import type { CsvFieldDraft, ExportProjectSnapshot } from '../types';

const SX3_HEADERS = [
  'X3_ARQUIVO',
  'X3_ORDEM',
  'X3_CAMPO',
  'X3_TIPO',
  'X3_TAMANHO',
  'X3_DECIMAL',
  'X3_TITULO',
  'X3_TITSPA',
  'X3_TITENG',
  'X3_DESCRIC',
  'X3_DESCSPA',
  'X3_DESCENG',
  'X3_PICTURE',
  'X3_VALID',
  'X3_USADO',
  'X3_RELACAO',
  'X3_F3',
  'X3_NIVEL',
  'X3_CHECK',
  'X3_TRIGGER',
  'X3_PROPRI',
  'X3_BROWSE',
  'X3_VISUAL',
  'X3_CONTEXT',
  'X3_OBRIGAT',
  'X3_VLDUSER',
  'X3_CBOX',
  'X3_CBOXSPA',
  'X3_CBOXENG',
  'X3_PICTVAR',
  'X3_WHEN',
  'X3_INIBRW',
  'X3_GRPSXG',
  'X3_FOLDER',
  'X3_PYME',
  'X3_CONDSQL',
  'X3_CHKSQL',
  'X3_IDXSRV',
  'X3_ORTOGRA',
  'X3_IDXFLD',
  'X3_TELA',
  'X3_PICBRV',
  'X3_AGRUP',
  'X3_POSLGT',
  'X3_MODAL',
  'X3_MODULO',
  'X3_RESERV',
] as const;

function encodeUsado(flags: Record<string, unknown>): string {
  const defaults: UsadoFlags = {
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
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof UsadoFlags>) {
    if (typeof flags[key] === 'boolean') merged[key] = flags[key];
  }
  return encodeX3Usado(merged);
}

function modulesBitmap(field: CsvFieldDraft): string {
  const flags = field.modulesFlags;
  if (flags && typeof flags === 'object' && 'bitmap' in flags) {
    const b = flags.bitmap;
    if (typeof b === 'number') return String(b);
  }
  return '0';
}

export function exportSx3Csv(snapshot: ExportProjectSnapshot): string {
  const rows: string[][] = [];
  for (const table of snapshot.tables) {
    for (const field of table.fields) {
      rows.push([
        table.prefix,
        field.order,
        field.name,
        field.type,
        String(field.size),
        String(field.decimals),
        field.titlePt,
        field.titleEs ?? '',
        field.titleEn ?? '',
        field.descPt,
        field.descEs ?? '',
        field.descEn ?? '',
        field.picture ?? '',
        field.validation ?? '',
        encodeUsado(field.usadoFlags),
        field.defaultRel ?? '',
        field.searchKey ?? '',
        String(field.level),
        field.hasCheck,
        field.hasTrigger,
        field.owner,
        field.showBrowse,
        field.visualMode,
        field.contextMode,
        field.required ?? '',
        field.userValidation ?? '',
        field.comboPt ?? '',
        field.comboEs ?? '',
        field.comboEn ?? '',
        field.pictureVar ?? '',
        field.whenExpr ?? '',
        field.initBrowse ?? '',
        field.groupSxg ?? '',
        field.folder ?? '',
        field.pyme,
        field.sqlCondition ?? '',
        field.sqlCheck ?? '',
        field.serverIndex,
        field.spelling,
        field.fieldIndex,
        field.screen ?? '',
        field.pictureBrowse ?? '',
        field.grouping ?? '',
        field.positionLogix,
        field.modal,
        modulesBitmap(field),
        field.reserved ?? '',
      ]);
    }
  }
  return formatCsv([...SX3_HEADERS], rows);
}
