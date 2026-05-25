import type { TemplateContent } from '@sxgerador/shared-types';
import { TemplateContentSchema } from '@sxgerador/shared-types';
import type { Field, Index, Table } from '../../generated/prisma';

type FlatJsonFlags = Record<string, string | number | boolean | null>;

export function buildTemplateContent(
  table: Table,
  fields: Field[],
  indexes: Index[],
): TemplateContent {
  const content: TemplateContent = {
    formatVersion: 1,
    table: {
      prefix: table.prefix,
      fileName: table.fileName,
      namePt: table.namePt,
      nameEs: table.nameEs,
      nameEn: table.nameEn,
      routine: table.routine,
      modeCompany: table.modeCompany,
      modeUnit: table.modeUnit,
      modeBranch: table.modeBranch,
      ttsEnabled: table.ttsEnabled,
      uniqueKey: table.uniqueKey,
      pyme: table.pyme,
      modules: table.modules,
      hasClob: table.hasClob,
      autoIncRec: table.autoIncRec,
      tamFil: table.tamFil,
      tamUn: table.tamUn,
      tamEmp: table.tamEmp,
      notes: table.notes,
    },
    fields: fields.map((f) => ({
      name: f.name,
      order: f.order,
      type: f.type,
      size: f.size,
      decimals: f.decimals,
      titlePt: f.titlePt,
      titleEs: f.titleEs,
      titleEn: f.titleEn,
      descPt: f.descPt,
      descEs: f.descEs,
      descEn: f.descEn,
      picture: f.picture,
      pictureVar: f.pictureVar,
      pictureBrowse: f.pictureBrowse,
      validation: f.validation,
      userValidation: f.userValidation,
      defaultRel: f.defaultRel,
      whenExpr: f.whenExpr,
      initBrowse: f.initBrowse,
      comboPt: f.comboPt,
      comboEs: f.comboEs,
      comboEn: f.comboEn,
      searchKey: f.searchKey,
      visualMode: f.visualMode,
      contextMode: f.contextMode,
      owner: f.owner,
      required: f.required,
      showBrowse: f.showBrowse,
      hasCheck: f.hasCheck,
      hasTrigger: f.hasTrigger,
      level: f.level,
      pyme: f.pyme,
      serverIndex: f.serverIndex,
      fieldIndex: f.fieldIndex,
      spelling: f.spelling,
      modal: f.modal,
      positionLogix: f.positionLogix,
      usadoFlags: toFlatJsonFlags(f.usadoFlags),
      modulesFlags: toFlatJsonFlags(f.modulesFlags),
      sqlCondition: f.sqlCondition,
      sqlCheck: f.sqlCheck,
      groupSxg: f.groupSxg,
      folder: f.folder,
      screen: f.screen,
      grouping: f.grouping,
      reserved: f.reserved,
      notes: f.notes,
    })),
    indexes: indexes.map((ix) => ({
      order: ix.order,
      key: ix.key,
      descPt: ix.descPt,
      descEs: ix.descEs,
      descEn: ix.descEn,
      owner: ix.owner,
      searchExpr: ix.searchExpr,
      nickname: ix.nickname,
      showSearch: ix.showSearch,
      isVirtual: ix.isVirtual,
      virtualCustomizable: ix.virtualCustomizable,
      notes: ix.notes,
    })),
  };

  return TemplateContentSchema.parse(content);
}

export function remapTemplatePrefix(content: TemplateContent, newPrefix: string): TemplateContent {
  const oldPrefix = content.table.prefix;
  if (oldPrefix === newPrefix) return content;

  const replacePrefix = (value: string | null | undefined): string | null | undefined => {
    if (!value) return value;
    return value
      .replaceAll(oldPrefix, newPrefix)
      .replaceAll(oldPrefix.toLowerCase(), newPrefix.toLowerCase());
  };

  const replaceFieldName = (name: string): string => {
    if (name.startsWith(`${oldPrefix}_`)) {
      return `${newPrefix}_${name.slice(oldPrefix.length + 1)}`;
    }
    return name;
  };

  return TemplateContentSchema.parse({
    formatVersion: 1,
    table: {
      ...content.table,
      prefix: newPrefix,
      fileName: `${newPrefix}010`,
      uniqueKey: replacePrefix(content.table.uniqueKey) ?? null,
    },
    fields: content.fields.map((f) => ({
      ...f,
      name: replaceFieldName(f.name),
      validation: replacePrefix(f.validation) ?? null,
      userValidation: replacePrefix(f.userValidation) ?? null,
      defaultRel: replacePrefix(f.defaultRel) ?? null,
      whenExpr: replacePrefix(f.whenExpr) ?? null,
      initBrowse: replacePrefix(f.initBrowse) ?? null,
      required: replacePrefix(f.required) ?? null,
      sqlCondition: replacePrefix(f.sqlCondition) ?? null,
      sqlCheck: replacePrefix(f.sqlCheck) ?? null,
    })),
    indexes: content.indexes.map((ix) => ({
      ...ix,
      key: replacePrefix(ix.key) ?? ix.key,
    })),
  });
}

function toFlatJsonFlags(value: unknown): FlatJsonFlags {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const flags: FlatJsonFlags = {};
  for (const [key, flagValue] of Object.entries(value)) {
    if (
      typeof flagValue === 'string' ||
      typeof flagValue === 'number' ||
      typeof flagValue === 'boolean' ||
      flagValue === null
    ) {
      flags[key] = flagValue;
    }
  }
  return flags;
}
