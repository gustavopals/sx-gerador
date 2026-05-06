import { computed, inject } from '@angular/core';
import type { CreateFieldInput, UpdateFieldInput } from '@sxgerador/shared-types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { FieldsService, type FieldSummary } from '../core/services/fields.service';

interface FieldsState {
  fields: FieldSummary[];
  currentField: FieldSummary | null;
  isLoading: boolean;
}

const initialState: FieldsState = {
  fields: [],
  currentField: null,
  isLoading: false,
};

export const FieldsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isEmpty: computed(() => !store.isLoading() && store.fields().length === 0),
  })),
  withMethods((store, service = inject(FieldsService)) => ({
    async loadFields(projectId: string, tableId: string, search?: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const response = await service.list(projectId, tableId, search);
        patchState(store, { fields: response.fields.filter((field) => !field.deletedAt) });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async loadField(projectId: string, tableId: string, fieldId: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const field = await service.get(projectId, tableId, fieldId);
        patchState(store, { currentField: field });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async create(
      projectId: string,
      tableId: string,
      input: CreateFieldInput,
    ): Promise<FieldSummary> {
      patchState(store, { isLoading: true });
      try {
        const field = await service.create(projectId, tableId, input);
        patchState(store, { currentField: field, fields: [...store.fields(), field] });
        return field;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async update(
      projectId: string,
      tableId: string,
      fieldId: string,
      input: UpdateFieldInput,
    ): Promise<FieldSummary> {
      patchState(store, { isLoading: true });
      try {
        const field = await service.update(projectId, tableId, fieldId, input);
        patchState(store, {
          currentField: field,
          fields: store.fields().map((item) => (item.id === fieldId ? field : item)),
        });
        return field;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async delete(projectId: string, tableId: string, fieldId: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await service.archive(projectId, tableId, fieldId);
        patchState(store, {
          currentField: store.currentField()?.id === fieldId ? null : store.currentField(),
          fields: store.fields().filter((item) => item.id !== fieldId),
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async reorder(projectId: string, tableId: string, fieldIds: string[]): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const fields = await service.reorder(projectId, tableId, fieldIds);
        patchState(store, { fields });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async bulkUpdate(
      projectId: string,
      tableId: string,
      fieldIds: string[],
      changes: UpdateFieldInput,
    ): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await service.bulkUpdate(projectId, tableId, fieldIds, changes);
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    clearCurrentField(): void {
      patchState(store, { currentField: null });
    },
  })),
);
