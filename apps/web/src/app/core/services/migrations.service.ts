import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DraftMigrationItem {
  id: string;
  operation: string;
  targetType: string;
  targetName: string;
  createdAt: string;
}

export interface DraftMigrationResponse {
  draft: {
    id: string;
    projectId: string;
    sequence: number;
    name: string;
    status: 'DRAFT';
    createdAt: string;
    updatedAt: string;
  };
  items: DraftMigrationItem[];
}

export interface GeneratedMigrationResponse {
  migration: {
    id: string;
    sequence: number;
    name: string;
    status: 'GENERATED';
    generatedAt: string;
    createdAt: string;
  };
}

export interface GeneratedMigrationListItem {
  id: string;
  sequence: number;
  name: string;
  createdAt: string;
  generatedAt: string | null;
  createdBy: string;
  itemsCount: number;
  items: DraftMigrationItem[];
}

@Injectable({ providedIn: 'root' })
export class MigrationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  async getDraft(projectId: string): Promise<DraftMigrationResponse> {
    return firstValueFrom(
      this.http.get<DraftMigrationResponse>(
        `${this.apiUrl}/projects/${projectId}/migrations/draft`,
      ),
    );
  }

  async list(projectId: string): Promise<{ migrations: GeneratedMigrationListItem[] }> {
    return firstValueFrom(
      this.http.get<{ migrations: GeneratedMigrationListItem[] }>(
        `${this.apiUrl}/projects/${projectId}/migrations`,
      ),
    );
  }

  async generate(projectId: string, name: string): Promise<GeneratedMigrationResponse> {
    return firstValueFrom(
      this.http.post<GeneratedMigrationResponse>(
        `${this.apiUrl}/projects/${projectId}/migrations/generate`,
        {
          name,
        },
      ),
    );
  }

  async preview(projectId: string, migrationId: string): Promise<{ code: string }> {
    return firstValueFrom(
      this.http.get<{ code: string }>(
        `${this.apiUrl}/projects/${projectId}/migrations/${migrationId}/preview`,
      ),
    );
  }

  async download(projectId: string, migrationId: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/projects/${projectId}/migrations/${migrationId}/download`, {
        responseType: 'blob',
      }),
    );
  }
}

export function mapMigrationsError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 404) return 'Draft ou migration não encontrada.';
    if (err.status === 422) return 'Não foi possível gerar migration. Revise as validações.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação de migration.';
}
