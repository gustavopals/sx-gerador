import type { CsvTableDraft } from '../types';
import { generateCuid } from '../utils';

/** Projeto mínimo para montar documento de importação compatível com F8.2. */
export interface ImportProjectMeta {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  ownerUserId: string | null;
  ownerTeamId: string | null;
  defaultTamFil: number;
  defaultLang: 'pt-BR' | 'en-US' | 'es-ES';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectImportDocumentShape {
  format: 'sxgerador-project';
  formatVersion: 1;
  exportedAt: string;
  project: ImportProjectMeta;
  tables: Array<
    CsvTableDraft & {
      id: string;
      projectId: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
      fields: Array<
        CsvTableDraft['fields'][number] & {
          id: string;
          tableId: string;
          createdAt: Date;
          updatedAt: Date;
          deletedAt: null;
        }
      >;
      indexes: Array<
        CsvTableDraft['indexes'][number] & {
          id: string;
          tableId: string;
          createdAt: Date;
          updatedAt: Date;
          deletedAt: null;
        }
      >;
    }
  >;
}

export function buildImportDocumentFromCsv(
  project: ImportProjectMeta,
  tables: CsvTableDraft[],
): ProjectImportDocumentShape {
  const now = new Date();
  return {
    format: 'sxgerador-project',
    formatVersion: 1,
    exportedAt: now.toISOString(),
    project,
    tables: tables.map((t) => {
      const tableId = generateCuid();
      return {
        ...t,
        id: tableId,
        projectId: project.id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        fields: t.fields.map((f) => ({
          ...f,
          id: generateCuid(),
          tableId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })),
        indexes: t.indexes.map((ix) => ({
          ...ix,
          id: generateCuid(),
          tableId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })),
      };
    }),
  };
}
