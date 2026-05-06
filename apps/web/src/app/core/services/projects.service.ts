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
}

export function mapProjectsError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 409) return 'Já existe um projeto usando esse slug.';
    if (err.status === 422) return 'Revise os campos destacados.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
