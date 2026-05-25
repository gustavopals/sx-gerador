import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  CreateProjectInput,
  ProjectVisibility,
  UpdateProjectInput,
} from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: ProjectVisibility;
  ownerUserId: string | null;
  ownerTeamId: string | null;
  defaultTamFil: number;
  defaultLang: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tableCount?: number;
}

export interface ProjectsListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListProjectsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface ProjectsListResponse {
  projects: ProjectSummary[];
  meta: ProjectsListMeta;
}

export interface ImportPreviewTableDetail {
  prefix: string;
  action: 'create' | 'update';
  fields: { create: string[]; update: string[]; delete: string[] };
  indexes: { create: string[]; update: string[]; delete: string[] };
}

export interface ImportPreviewSummary {
  tablesCreated: number;
  tablesUpdated: number;
  tablesDeleted: number;
  fieldsCreated: number;
  fieldsUpdated: number;
  fieldsDeleted: number;
  indexesCreated: number;
  indexesUpdated: number;
  indexesDeleted: number;
}

export interface ImportPreviewResponse {
  valid: boolean;
  errors: string[];
  summary: ImportPreviewSummary | null;
  tables: ImportPreviewTableDetail[] | null;
  csvWarnings?: string[];
}

export type CsvDictionary = 'sx2' | 'sx3' | 'six';

export interface ImportCsvPayload {
  sx2?: string;
  sx3?: string;
  six?: string;
  options?: { syncDeletions?: boolean };
}

export interface ImportApplyResponse {
  success: boolean;
  errors: string[];
  summary?: ImportPreviewSummary;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  async list(params: ListProjectsParams = {}): Promise<ProjectsListResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 12));

    if (params.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.includeArchived) httpParams = httpParams.set('includeArchived', 'true');

    return firstValueFrom(
      this.http.get<ProjectsListResponse>(this.baseUrl, { params: httpParams }),
    );
  }

  async create(input: CreateProjectInput): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.post<{ project: ProjectSummary }>(this.baseUrl, input),
    );
    return response.project;
  }

  async get(id: string): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.get<{ project: ProjectSummary }>(`${this.baseUrl}/${id}`),
    );
    return response.project;
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ project: ProjectSummary }>(`${this.baseUrl}/${id}`, input),
    );
    return response.project;
  }

  async checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
    let params = new HttpParams().set('slug', slug);
    if (excludeId) params = params.set('excludeId', excludeId);
    const response = await firstValueFrom(
      this.http.get<{ available: boolean }>(`${this.baseUrl}/check-slug`, { params }),
    );
    return response.available;
  }

  async duplicate(id: string): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.post<{ project: ProjectSummary }>(`${this.baseUrl}/${id}/duplicate`, {}),
    );
    return response.project;
  }

  async archive(id: string): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ project: ProjectSummary }>(`${this.baseUrl}/${id}`),
    );
    return response.project;
  }

  async restore(id: string): Promise<ProjectSummary> {
    const response = await firstValueFrom(
      this.http.post<{ project: ProjectSummary }>(`${this.baseUrl}/${id}/restore`, {}),
    );
    return response.project;
  }

  async importPreview(projectId: string, document: unknown): Promise<ImportPreviewResponse> {
    return firstValueFrom(
      this.http.post<ImportPreviewResponse>(`${this.baseUrl}/${projectId}/import/preview`, {
        document,
      }),
    );
  }

  async importApply(
    projectId: string,
    document: unknown,
    options?: { syncDeletions?: boolean },
  ): Promise<ImportApplyResponse> {
    return firstValueFrom(
      this.http.post<ImportApplyResponse>(`${this.baseUrl}/${projectId}/import`, {
        document,
        options,
      }),
    );
  }

  async importCsvPreview(
    projectId: string,
    payload: ImportCsvPayload,
  ): Promise<ImportPreviewResponse> {
    return firstValueFrom(
      this.http.post<ImportPreviewResponse>(
        `${this.baseUrl}/${projectId}/import/csv/preview`,
        payload,
      ),
    );
  }

  async importCsvApply(projectId: string, payload: ImportCsvPayload): Promise<ImportApplyResponse> {
    return firstValueFrom(
      this.http.post<ImportApplyResponse>(`${this.baseUrl}/${projectId}/import/csv`, payload),
    );
  }

  async downloadProjectCsvExport(
    id: string,
    dictionary: CsvDictionary,
    slug: string,
  ): Promise<void> {
    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${id}/export/csv/${dictionary}`, {
        responseType: 'blob',
        observe: 'response',
      }),
    );
    const blob = response.body;
    if (!blob) throw new Error('Resposta vazia do servidor.');

    const headerName = response.headers.get('Content-Disposition');
    const fileName =
      parseContentDispositionFilename(headerName) ?? `sxgerador-${slug}-${dictionary}.csv`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async downloadProjectExport(id: string, slug: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${id}/export`, {
        responseType: 'blob',
        observe: 'response',
      }),
    );
    const blob = response.body;
    if (!blob) throw new Error('Resposta vazia do servidor.');

    const headerName = response.headers.get('Content-Disposition');
    const fileName = parseContentDispositionFilename(headerName) ?? `sxgerador-${slug}.json`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

export function mapProjectsError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 403) return 'Você não tem permissão para esta ação.';
    if (err.status === 409) return 'Já existe um projeto usando esse slug.';
    if (err.status === 422) {
      const body = err.error;
      if (body && typeof body === 'object' && 'error' in body) {
        const apiErr = (body as { error?: { code?: string; messages?: unknown } }).error;
        if (
          apiErr?.code === 'IMPORT_VALIDATION_FAILED' &&
          Array.isArray(apiErr.messages) &&
          apiErr.messages.length > 0
        ) {
          return (apiErr.messages as string[]).join('\n');
        }
      }
      return 'Revise os campos destacados.';
    }
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
