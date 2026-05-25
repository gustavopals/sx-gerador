export type SharingMode = 'C' | 'E';
export type YesNo = 'S' | 'N';
export type FieldType = 'C' | 'N' | 'D' | 'M' | 'L';
export type VisualMode = 'V' | 'A' | 'R';
export type ContextMode = 'R' | 'V';
export type OwnerType = 'U' | 'S';
export type DictionaryKind = 'sx2' | 'sx3' | 'six';

export interface CsvFieldDraft {
  name: string;
  order: string;
  type: FieldType;
  size: number;
  decimals: number;
  titlePt: string;
  titleEs: string | null;
  titleEn: string | null;
  descPt: string;
  descEs: string | null;
  descEn: string | null;
  picture: string | null;
  pictureVar: string | null;
  pictureBrowse: string | null;
  validation: string | null;
  userValidation: string | null;
  defaultRel: string | null;
  whenExpr: string | null;
  initBrowse: string | null;
  comboPt: string | null;
  comboEs: string | null;
  comboEn: string | null;
  searchKey: string | null;
  visualMode: VisualMode;
  contextMode: ContextMode;
  owner: OwnerType;
  required: string | null;
  showBrowse: YesNo;
  hasCheck: YesNo;
  hasTrigger: YesNo;
  level: number;
  pyme: YesNo;
  serverIndex: YesNo;
  fieldIndex: YesNo;
  spelling: YesNo;
  modal: YesNo;
  positionLogix: YesNo;
  usadoFlags: Record<string, boolean>;
  modulesFlags: { bitmap: number };
  sqlCondition: string | null;
  sqlCheck: string | null;
  groupSxg: string | null;
  folder: string | null;
  screen: string | null;
  grouping: string | null;
  reserved: string | null;
  notes: string | null;
}

export interface CsvIndexDraft {
  order: string;
  key: string;
  descPt: string;
  descEs: string | null;
  descEn: string | null;
  owner: OwnerType;
  searchExpr: string | null;
  nickname: string | null;
  showSearch: YesNo;
  isVirtual: YesNo;
  virtualCustomizable: YesNo;
  notes: string | null;
}

export interface CsvTableDraft {
  prefix: string;
  fileName: string;
  namePt: string;
  nameEs: string | null;
  nameEn: string | null;
  routine: string | null;
  modeCompany: SharingMode;
  modeUnit: SharingMode;
  modeBranch: SharingMode;
  ttsEnabled: YesNo;
  uniqueKey: string | null;
  pyme: YesNo;
  modules: number;
  hasClob: YesNo;
  autoIncRec: YesNo;
  tamFil: number;
  tamUn: number;
  tamEmp: number;
  notes: string | null;
  fields: CsvFieldDraft[];
  indexes: CsvIndexDraft[];
}

export interface CsvImportInput {
  sx2?: string;
  sx3?: string;
  six?: string;
}

export interface CsvImportResult {
  tables: CsvTableDraft[];
  warnings: string[];
  errors: string[];
}

/** Snapshot mínimo para exportação CSV (compatível com export JSON da API). */
export interface ExportTableRow {
  prefix: string;
  fileName: string;
  namePt: string;
  nameEs: string | null;
  nameEn: string | null;
  routine: string | null;
  modeCompany: SharingMode;
  modeUnit: SharingMode;
  modeBranch: SharingMode;
  ttsEnabled: YesNo;
  uniqueKey: string | null;
  pyme: YesNo;
  modules: number;
  hasClob: YesNo;
  autoIncRec: YesNo;
  tamFil: number;
  tamUn: number;
  tamEmp: number;
  fields: Array<CsvFieldDraft & { tablePrefix: string }>;
  indexes: Array<CsvIndexDraft & { tablePrefix: string }>;
}

export interface ExportProjectSnapshot {
  slug: string;
  tables: ExportTableRow[];
}
