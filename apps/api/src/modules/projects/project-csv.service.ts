import {
  assembleCsvImport,
  buildImportDocumentFromCsv,
  exportSixCsv,
  exportSx2Csv,
  exportSx3Csv,
  toExportSnapshot,
  type ImportProjectMeta,
} from '@sxgerador/protheus-csv';
import type { PrismaClient } from '../../generated/prisma';
import { logAudit } from '../audit';
import type {
  ImportApplyResult,
  ImportPreviewResult,
  ProjectImportService,
} from './project-import.service';
import { ProjectErrors } from './projects.errors';
import { PROJECT_EXPORT_INCLUDE, type ProjectsService } from './projects.service';

export type CsvDictionary = 'sx2' | 'sx3' | 'six';

export interface CsvImportPreviewResult extends ImportPreviewResult {
  csvWarnings: string[];
}

export class ProjectCsvService {
  constructor(
    private readonly db: PrismaClient,
    private readonly projects: ProjectsService,
    private readonly projectImport: ProjectImportService,
  ) {}

  async exportCsv(
    projectId: string,
    dictionary: CsvDictionary,
    actorUserId?: string,
  ): Promise<{ content: string; fileName: string }> {
    const doc = await this.projects.exportJson(projectId, actorUserId);
    const snapshot = toExportSnapshot(doc.project.slug, doc.tables);
    const day = doc.exportedAt.slice(0, 10).replaceAll('-', '');
    const slug = doc.project.slug.replace(/[^a-z0-9-]/gi, '');

    let content: string;
    let suffix: string;
    switch (dictionary) {
      case 'sx2':
        content = exportSx2Csv(snapshot);
        suffix = 'sx2';
        break;
      case 'sx3':
        content = exportSx3Csv(snapshot);
        suffix = 'sx3';
        break;
      case 'six':
        content = exportSixCsv(snapshot);
        suffix = 'six';
        break;
    }

    await logAudit(this.db, 'projects.export.csv', actorUserId ?? null, {
      projectId,
      dictionary,
    });

    return {
      content,
      fileName: `sxgerador-${slug}-${suffix}-${day}.csv`,
    };
  }

  async importPreview(
    projectId: string,
    input: { sx2?: string; sx3?: string; six?: string },
    actorUserId?: string,
  ): Promise<CsvImportPreviewResult> {
    const assembled = await this.buildDocument(projectId, input, actorUserId);
    if (!assembled.ok) {
      return {
        valid: false,
        errors: assembled.errors,
        summary: null,
        tables: null,
        csvWarnings: assembled.warnings,
      };
    }

    const preview = await this.projectImport.preview(projectId, assembled.document, actorUserId);
    return { ...preview, csvWarnings: assembled.warnings };
  }

  async importApply(
    projectId: string,
    input: { sx2?: string; sx3?: string; six?: string },
    actorUserId?: string,
    options?: { syncDeletions?: boolean },
  ): Promise<ImportApplyResult & { csvWarnings?: string[] }> {
    const assembled = await this.buildDocument(projectId, input, actorUserId);
    if (!assembled.ok) {
      return { success: false, errors: assembled.errors, csvWarnings: assembled.warnings };
    }

    const result = await this.projectImport.apply(
      projectId,
      assembled.document,
      actorUserId,
      options,
    );

    if (result.success) {
      await logAudit(this.db, 'projects.import.csv.apply', actorUserId ?? null, {
        projectId,
        syncDeletions: options?.syncDeletions === true,
      });
    }

    return { ...result, csvWarnings: assembled.warnings };
  }

  private async buildDocument(
    projectId: string,
    input: { sx2?: string; sx3?: string; six?: string },
    actorUserId?: string,
  ): Promise<
    | { ok: true; document: unknown; warnings: string[] }
    | { ok: false; errors: string[]; warnings: string[] }
  > {
    await this.projects.get(projectId, actorUserId);

    const parsed = assembleCsvImport(input);
    if (parsed.errors.length > 0) {
      return { ok: false, errors: parsed.errors, warnings: parsed.warnings };
    }

    const project = await this.db.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: PROJECT_EXPORT_INCLUDE,
    });
    if (!project) throw ProjectErrors.NOT_FOUND;

    const meta: ImportProjectMeta = {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      visibility: project.visibility,
      ownerUserId: project.ownerUserId,
      ownerTeamId: project.ownerTeamId,
      defaultTamFil: project.defaultTamFil,
      defaultLang: project.defaultLang as ImportProjectMeta['defaultLang'],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
    };

    const document = buildImportDocumentFromCsv(meta, parsed.tables);
    return { ok: true, document, warnings: parsed.warnings };
  }
}
