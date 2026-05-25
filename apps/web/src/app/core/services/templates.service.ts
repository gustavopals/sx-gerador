import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { TemplateCategory } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TemplateSummary {
  id: string;
  authorId: string | null;
  name: string;
  description: string | null;
  category: string;
  sourceTablePrefix: string | null;
  downloads: number;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
}

export interface TemplatesListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApplyTemplatePreviewResult {
  valid: boolean;
  errors: string[];
  targetPrefix: string | null;
  summary: {
    tableName: string;
    fieldsCount: number;
    indexesCount: number;
    action: 'create';
  } | null;
}

export interface ApplyTemplateResult {
  success: boolean;
  errors: string[];
  tableId?: string;
  prefix?: string;
}

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/templates`;

  async list(
    params: {
      page?: number;
      pageSize?: number;
      category?: TemplateCategory;
      search?: string;
      officialOnly?: boolean;
    } = {},
  ): Promise<{ templates: TemplateSummary[]; meta: TemplatesListMeta }> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 12));
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.officialOnly) httpParams = httpParams.set('officialOnly', 'true');

    return firstValueFrom(
      this.http.get<{ templates: TemplateSummary[]; meta: TemplatesListMeta }>(this.baseUrl, {
        params: httpParams,
      }),
    );
  }

  async get(id: string): Promise<TemplateSummary> {
    const res = await firstValueFrom(
      this.http.get<{ template: TemplateSummary }>(`${this.baseUrl}/${id}`),
    );
    return res.template;
  }

  async publishFromTable(input: {
    name: string;
    description?: string | null;
    category: TemplateCategory;
    projectId: string;
    tableId: string;
  }): Promise<TemplateSummary> {
    const res = await firstValueFrom(
      this.http.post<{ template: TemplateSummary }>(this.baseUrl, input),
    );
    return res.template;
  }

  async previewApply(
    templateId: string,
    body: { projectId: string; prefixOverride?: string },
  ): Promise<ApplyTemplatePreviewResult> {
    return firstValueFrom(
      this.http.post<ApplyTemplatePreviewResult>(
        `${this.baseUrl}/${templateId}/apply/preview`,
        body,
      ),
    );
  }

  async apply(
    templateId: string,
    body: { projectId: string; prefixOverride?: string },
  ): Promise<ApplyTemplateResult> {
    return firstValueFrom(
      this.http.post<ApplyTemplateResult>(`${this.baseUrl}/${templateId}/apply`, body),
    );
  }
}

export function mapTemplatesError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 403) return 'Você não tem permissão para esta ação.';
    if (err.status === 409) return err.error?.error?.message ?? 'Conflito de prefixo ou recurso.';
    if (err.status === 422) {
      const body = err.error;
      if (body?.error?.code === 'TEMPLATE_APPLY_FAILED' && Array.isArray(body.error.messages)) {
        return (body.error.messages as string[]).join('\n');
      }
      return body?.error?.message ?? 'Não foi possível aplicar o template.';
    }
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
