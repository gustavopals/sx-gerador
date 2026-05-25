import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CompareMigrationsBody, CompareProjectsBody } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiffSummary {
  tablesAdded: number;
  tablesRemoved: number;
  tablesChanged: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  fieldsChanged: number;
  indexesAdded: number;
  indexesRemoved: number;
  indexesChanged: number;
}

export interface ScalarChange {
  path: string;
  before: unknown;
  after: unknown;
}

export interface EntityDiff {
  key: string;
  kind: 'added' | 'removed' | 'changed';
  changes: ScalarChange[];
}

export interface TableDiff {
  prefix: string;
  kind: 'added' | 'removed' | 'changed';
  tableChanges: ScalarChange[];
  fields: EntityDiff[];
  indexes: EntityDiff[];
}

export interface DiffResult {
  tables: TableDiff[];
  summary: DiffSummary;
}

export interface CompareProjectsResponse {
  projectA: { id: string; name: string; slug: string };
  projectB: { id: string; name: string; slug: string };
  diff: DiffResult;
}

export interface MigrationItemSnapshot {
  id: string;
  operation: string;
  targetType: string;
  targetName: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

export interface CompareMigrationsResponse {
  migrationA: { id: string; name: string; sequence: number };
  migrationB: { id: string; name: string; sequence: number };
  dictionaryDiff: DiffResult;
  itemsDiff: {
    onlyInA: MigrationItemSnapshot[];
    onlyInB: MigrationItemSnapshot[];
    changed: Array<{
      key: string;
      before: MigrationItemSnapshot;
      after: MigrationItemSnapshot;
      changes: ScalarChange[];
    }>;
    summary: {
      onlyInACount: number;
      onlyInBCount: number;
      changedCount: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class DiffService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  async compareProjects(body: CompareProjectsBody): Promise<CompareProjectsResponse> {
    return firstValueFrom(
      this.http.post<CompareProjectsResponse>(`${this.apiUrl}/diff/projects`, body),
    );
  }

  async compareMigrations(body: CompareMigrationsBody): Promise<CompareMigrationsResponse> {
    return firstValueFrom(
      this.http.post<CompareMigrationsResponse>(`${this.apiUrl}/diff/migrations`, body),
    );
  }
}

export function mapDiffError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Erro ao comparar.';
  const body = err.error as { error?: { message?: string; code?: string } } | null;
  return body?.error?.message ?? `Erro ${err.status}.`;
}
