import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CreateIndexInput, UpdateIndexInput } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IndexSummary {
  id: string;
  tableId: string;
  order: string;
  key: string;
  descPt: string;
  descEs: string | null;
  descEn: string | null;
  owner: 'U' | 'S';
  searchExpr: string | null;
  nickname: string | null;
  showSearch: 'S' | 'N';
  isVirtual: 'S' | 'N';
  virtualCustomizable: 'S' | 'N';
  notes: string | null;
  deletedAt: string | null;
}

export interface IndexesListResponse {
  indexes: IndexSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class IndexesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private indexesUrl(projectId: string, tableId: string): string {
    return `${this.apiUrl}/projects/${projectId}/tables/${tableId}/indexes`;
  }

  async list(projectId: string, tableId: string, search?: string): Promise<IndexesListResponse> {
    let params = new HttpParams().set('page', '1').set('pageSize', '100');
    if (search?.trim()) params = params.set('search', search.trim());
    return firstValueFrom(
      this.http.get<IndexesListResponse>(this.indexesUrl(projectId, tableId), { params }),
    );
  }

  async get(projectId: string, tableId: string, indexId: string): Promise<IndexSummary> {
    const response = await firstValueFrom(
      this.http.get<{ index: IndexSummary }>(`${this.indexesUrl(projectId, tableId)}/${indexId}`),
    );
    return response.index;
  }

  async create(projectId: string, tableId: string, input: CreateIndexInput): Promise<IndexSummary> {
    const response = await firstValueFrom(
      this.http.post<{ index: IndexSummary }>(this.indexesUrl(projectId, tableId), input),
    );
    return response.index;
  }

  async update(
    projectId: string,
    tableId: string,
    indexId: string,
    input: UpdateIndexInput,
  ): Promise<IndexSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ index: IndexSummary }>(
        `${this.indexesUrl(projectId, tableId)}/${indexId}`,
        input,
      ),
    );
    return response.index;
  }

  async archive(projectId: string, tableId: string, indexId: string): Promise<IndexSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ index: IndexSummary }>(
        `${this.indexesUrl(projectId, tableId)}/${indexId}`,
      ),
    );
    return response.index;
  }
}

export function mapIndexesError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 409) return 'Ordem de índice já está em uso nesta tabela.';
    if (err.status === 422)
      return 'Dados do índice inválidos. Verifique ordem, chave e campos usados.';
    if (err.status === 404) return 'Índice ou tabela não encontrado.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
