import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CreateTableInput, UpdateTableInput } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TableSummary {
  id: string;
  projectId: string;
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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TablesListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListTablesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface TablesListResponse {
  tables: TableSummary[];
  meta: TablesListMeta;
}

@Injectable({ providedIn: 'root' })
export class TablesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private tablesUrl(projectId: string): string {
    return `${this.apiUrl}/projects/${projectId}/tables`;
  }

  async list(projectId: string, params: ListTablesParams = {}): Promise<TablesListResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.includeArchived) httpParams = httpParams.set('includeArchived', 'true');

    return firstValueFrom(
      this.http.get<TablesListResponse>(this.tablesUrl(projectId), { params: httpParams }),
    );
  }

  async get(projectId: string, id: string): Promise<TableSummary> {
    const response = await firstValueFrom(
      this.http.get<{ table: TableSummary }>(`${this.tablesUrl(projectId)}/${id}`),
    );
    return response.table;
  }

  async create(projectId: string, input: CreateTableInput): Promise<TableSummary> {
    const response = await firstValueFrom(
      this.http.post<{ table: TableSummary }>(this.tablesUrl(projectId), input),
    );
    return response.table;
  }

  async update(projectId: string, id: string, input: UpdateTableInput): Promise<TableSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ table: TableSummary }>(`${this.tablesUrl(projectId)}/${id}`, input),
    );
    return response.table;
  }

  async archive(projectId: string, id: string): Promise<TableSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ table: TableSummary }>(`${this.tablesUrl(projectId)}/${id}`),
    );
    return response.table;
  }

  async restore(projectId: string, id: string): Promise<TableSummary> {
    const response = await firstValueFrom(
      this.http.post<{ table: TableSummary }>(`${this.tablesUrl(projectId)}/${id}/restore`, {}),
    );
    return response.table;
  }
}

export function mapTablesError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 409) return 'Prefixo já está em uso neste projeto.';
    if (err.status === 404) return 'Tabela não encontrada.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
