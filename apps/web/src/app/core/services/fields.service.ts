import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CreateFieldInput, UpdateFieldInput } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FieldSummary {
  id: string;
  tableId: string;
  name: string;
  order: string;
  type: 'C' | 'N' | 'D' | 'M' | 'L';
  size: number;
  decimals: number;
  titlePt: string;
  titleEs: string | null;
  titleEn: string | null;
  descPt: string;
  descEs: string | null;
  descEn: string | null;
  picture: string | null;
  validation: string | null;
  defaultRel: string | null;
  whenExpr: string | null;
  comboPt: string | null;
  comboEs: string | null;
  comboEn: string | null;
  usadoFlags: Record<string, unknown> | null;
  modulesFlags: Record<string, unknown> | null;
  searchKey: string | null;
  sqlCondition: string | null;
  sqlCheck: string | null;
  showBrowse: 'S' | 'N';
  visualMode: 'V' | 'A' | 'R';
  contextMode: 'R' | 'V';
  required: string | null;
  pyme: 'S' | 'N';
  spelling: 'S' | 'N';
  fieldIndex: 'S' | 'N';
  serverIndex: 'S' | 'N';
  modal: 'S' | 'N';
  positionLogix: 'S' | 'N';
  deletedAt: string | null;
}

export interface FieldsListResponse {
  fields: FieldSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class FieldsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private fieldsUrl(projectId: string, tableId: string): string {
    return `${this.apiUrl}/projects/${projectId}/tables/${tableId}/fields`;
  }

  async list(projectId: string, tableId: string, search?: string): Promise<FieldsListResponse> {
    let params = new HttpParams().set('page', '1').set('pageSize', '100');
    if (search?.trim()) params = params.set('search', search.trim());
    return firstValueFrom(
      this.http.get<FieldsListResponse>(this.fieldsUrl(projectId, tableId), { params }),
    );
  }

  async get(projectId: string, tableId: string, fieldId: string): Promise<FieldSummary> {
    const response = await firstValueFrom(
      this.http.get<{ field: FieldSummary }>(`${this.fieldsUrl(projectId, tableId)}/${fieldId}`),
    );
    return response.field;
  }

  async create(projectId: string, tableId: string, input: CreateFieldInput): Promise<FieldSummary> {
    const response = await firstValueFrom(
      this.http.post<{ field: FieldSummary }>(this.fieldsUrl(projectId, tableId), input),
    );
    return response.field;
  }

  async update(
    projectId: string,
    tableId: string,
    fieldId: string,
    input: UpdateFieldInput,
  ): Promise<FieldSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ field: FieldSummary }>(
        `${this.fieldsUrl(projectId, tableId)}/${fieldId}`,
        input,
      ),
    );
    return response.field;
  }

  async archive(projectId: string, tableId: string, fieldId: string): Promise<FieldSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ field: FieldSummary }>(`${this.fieldsUrl(projectId, tableId)}/${fieldId}`),
    );
    return response.field;
  }

  async reorder(projectId: string, tableId: string, fieldIds: string[]): Promise<FieldSummary[]> {
    const response = await firstValueFrom(
      this.http.post<{ fields: FieldSummary[] }>(`${this.fieldsUrl(projectId, tableId)}/reorder`, {
        fieldIds,
      }),
    );
    return response.fields;
  }

  async bulkUpdate(
    projectId: string,
    tableId: string,
    fieldIds: string[],
    changes: UpdateFieldInput,
  ): Promise<{ updatedCount: number }> {
    return firstValueFrom(
      this.http.post<{ updatedCount: number }>(`${this.fieldsUrl(projectId, tableId)}/bulk`, {
        fieldIds,
        changes,
      }),
    );
  }
}

export function mapFieldsError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 409) return 'Já existe campo com mesmo nome ou ordem nesta tabela.';
    if (err.status === 422) return 'Revise os campos do formulário.';
    if (err.status === 404) return 'Campo ou tabela não encontrado.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
