import type { ExportProjectSnapshot, ExportTableRow } from './types';

/** Converte snapshot da API (export JSON) para formato de exportação CSV. */
export function toExportSnapshot(
  slug: string,
  tables: Array<{
    prefix: string;
    fileName: string;
    namePt: string;
    nameEs: string | null;
    nameEn: string | null;
    routine: string | null;
    modeCompany: 'C' | 'E';
    modeUnit: 'C' | 'E';
    modeBranch: 'C' | 'E';
    ttsEnabled: 'S' | 'N';
    uniqueKey: string | null;
    pyme: 'S' | 'N';
    modules: number;
    hasClob: 'S' | 'N';
    autoIncRec: 'S' | 'N';
    tamFil: number;
    tamUn: number;
    tamEmp: number;
    fields: Array<Record<string, unknown>>;
    indexes: Array<Record<string, unknown>>;
  }>,
): ExportProjectSnapshot {
  const exportTables: ExportTableRow[] = tables.map((t) => ({
    prefix: t.prefix,
    fileName: t.fileName,
    namePt: t.namePt,
    nameEs: t.nameEs,
    nameEn: t.nameEn,
    routine: t.routine,
    modeCompany: t.modeCompany,
    modeUnit: t.modeUnit,
    modeBranch: t.modeBranch,
    ttsEnabled: t.ttsEnabled,
    uniqueKey: t.uniqueKey,
    pyme: t.pyme,
    modules: t.modules,
    hasClob: t.hasClob,
    autoIncRec: t.autoIncRec,
    tamFil: t.tamFil,
    tamUn: t.tamUn,
    tamEmp: t.tamEmp,
    fields: t.fields.map((f) => mapField(f)),
    indexes: t.indexes.map((ix) => mapIndex(ix)),
  }));

  return { slug, tables: exportTables };
}

function mapField(raw: Record<string, unknown>): ExportTableRow['fields'][number] {
  return {
    tablePrefix: '',
    name: String(raw['name'] ?? ''),
    order: String(raw['order'] ?? '01'),
    type: (raw['type'] as ExportTableRow['fields'][number]['type']) ?? 'C',
    size: Number(raw['size'] ?? 1),
    decimals: Number(raw['decimals'] ?? 0),
    titlePt: String(raw['titlePt'] ?? ''),
    titleEs: (raw['titleEs'] as string | null) ?? null,
    titleEn: (raw['titleEn'] as string | null) ?? null,
    descPt: String(raw['descPt'] ?? ''),
    descEs: (raw['descEs'] as string | null) ?? null,
    descEn: (raw['descEn'] as string | null) ?? null,
    picture: (raw['picture'] as string | null) ?? null,
    pictureVar: (raw['pictureVar'] as string | null) ?? null,
    pictureBrowse: (raw['pictureBrowse'] as string | null) ?? null,
    validation: (raw['validation'] as string | null) ?? null,
    userValidation: (raw['userValidation'] as string | null) ?? null,
    defaultRel: (raw['defaultRel'] as string | null) ?? null,
    whenExpr: (raw['whenExpr'] as string | null) ?? null,
    initBrowse: (raw['initBrowse'] as string | null) ?? null,
    comboPt: (raw['comboPt'] as string | null) ?? null,
    comboEs: (raw['comboEs'] as string | null) ?? null,
    comboEn: (raw['comboEn'] as string | null) ?? null,
    searchKey: (raw['searchKey'] as string | null) ?? null,
    visualMode: (raw['visualMode'] as ExportTableRow['fields'][number]['visualMode']) ?? 'A',
    contextMode: (raw['contextMode'] as ExportTableRow['fields'][number]['contextMode']) ?? 'R',
    owner: (raw['owner'] as ExportTableRow['fields'][number]['owner']) ?? 'U',
    required: (raw['required'] as string | null) ?? null,
    showBrowse: (raw['showBrowse'] as 'S' | 'N') ?? 'S',
    hasCheck: (raw['hasCheck'] as 'S' | 'N') ?? 'N',
    hasTrigger: (raw['hasTrigger'] as 'S' | 'N') ?? 'N',
    level: Number(raw['level'] ?? 0),
    pyme: (raw['pyme'] as 'S' | 'N') ?? 'N',
    serverIndex: (raw['serverIndex'] as 'S' | 'N') ?? 'N',
    fieldIndex: (raw['fieldIndex'] as 'S' | 'N') ?? 'N',
    spelling: (raw['spelling'] as 'S' | 'N') ?? 'N',
    modal: (raw['modal'] as 'S' | 'N') ?? 'N',
    positionLogix: (raw['positionLogix'] as 'S' | 'N') ?? 'N',
    usadoFlags: (raw['usadoFlags'] as Record<string, boolean>) ?? {},
    modulesFlags: (raw['modulesFlags'] as { bitmap: number }) ?? { bitmap: 0 },
    sqlCondition: (raw['sqlCondition'] as string | null) ?? null,
    sqlCheck: (raw['sqlCheck'] as string | null) ?? null,
    groupSxg: (raw['groupSxg'] as string | null) ?? null,
    folder: (raw['folder'] as string | null) ?? null,
    screen: (raw['screen'] as string | null) ?? null,
    grouping: (raw['grouping'] as string | null) ?? null,
    reserved: (raw['reserved'] as string | null) ?? null,
    notes: (raw['notes'] as string | null) ?? null,
  };
}

function mapIndex(raw: Record<string, unknown>): ExportTableRow['indexes'][number] {
  return {
    tablePrefix: '',
    order: String(raw['order'] ?? '1'),
    key: String(raw['key'] ?? ''),
    descPt: String(raw['descPt'] ?? ''),
    descEs: (raw['descEs'] as string | null) ?? null,
    descEn: (raw['descEn'] as string | null) ?? null,
    owner: (raw['owner'] as ExportTableRow['indexes'][number]['owner']) ?? 'U',
    searchExpr: (raw['searchExpr'] as string | null) ?? null,
    nickname: (raw['nickname'] as string | null) ?? null,
    showSearch: (raw['showSearch'] as 'S' | 'N') ?? 'S',
    isVirtual: (raw['isVirtual'] as 'S' | 'N') ?? 'N',
    virtualCustomizable: (raw['virtualCustomizable'] as 'S' | 'N') ?? 'N',
    notes: (raw['notes'] as string | null) ?? null,
  };
}
