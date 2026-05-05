/**
 * Tipos base para o advpl-builder.
 *
 * Esses tipos refletem o modelo de dados do Prisma (Migration + MigrationItem)
 * mas são independentes do ORM — recebem apenas dados serializados.
 */

export type MigrationOperation =
  | 'CREATE_TABLE'
  | 'ALTER_TABLE'
  | 'DROP_TABLE'
  | 'CREATE_FIELD'
  | 'ALTER_FIELD'
  | 'DROP_FIELD'
  | 'CREATE_INDEX'
  | 'ALTER_INDEX'
  | 'DROP_INDEX';

export interface MigrationItemInput {
  id: string;
  operation: MigrationOperation;
  targetType: 'TABLE' | 'FIELD' | 'INDEX';
  targetName: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

export interface MigrationInput {
  id: string;
  sequence: number;
  name: string;
  project: {
    name: string;
    slug: string;
  };
  author: {
    name: string;
    email: string;
  };
  items: MigrationItemInput[];
}

export interface BuildResult {
  /** Código AdvPL gerado (.PRW) */
  code: string;
  /** Código do helper SXG_HELPERS.PRW (gerado apenas uma vez por projeto) */
  helperCode: string;
  /** Avisos não-bloqueantes (ex: X3_F3 não referenciado) */
  warnings: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  targetName?: string;
}
