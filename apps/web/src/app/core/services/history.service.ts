import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { HistoryQuery } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HistoryEntry {
  id: string;
  migrationId: string;
  migrationSequence: number;
  migrationName: string;
  migrationGeneratedAt: string | null;
  operation: string;
  targetType: string;
  targetName: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
}

export interface HistoryListResponse {
  entries: HistoryEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  async listProjectHistory(
    projectId: string,
    query: HistoryQuery = {},
  ): Promise<HistoryListResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    if (query.operation) params = params.set('operation', query.operation);
    if (query.authorId) params = params.set('authorId', query.authorId);
    if (query.tablePrefix) params = params.set('tablePrefix', query.tablePrefix);
    if (query.from) params = params.set('from', query.from.toISOString());
    if (query.to) params = params.set('to', query.to.toISOString());

    return firstValueFrom(
      this.http.get<HistoryListResponse>(`${this.apiUrl}/projects/${projectId}/history`, {
        params,
      }),
    );
  }
}

export function mapHistoryError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Erro ao carregar histórico.';
  const body = err.error as { error?: { message?: string } } | null;
  return body?.error?.message ?? `Erro ${err.status}.`;
}
