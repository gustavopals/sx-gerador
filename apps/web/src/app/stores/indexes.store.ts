import { computed, inject } from '@angular/core';
import type { CreateIndexInput, UpdateIndexInput } from '@sxgerador/shared-types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { IndexesService, type IndexSummary } from '../core/services/indexes.service';

interface IndexesState {
  indexes: IndexSummary[];
  currentIndex: IndexSummary | null;
  isLoading: boolean;
}

const initialState: IndexesState = {
  indexes: [],
  currentIndex: null,
  isLoading: false,
};

export const IndexesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isEmpty: computed(() => !store.isLoading() && store.indexes().length === 0),
  })),
  withMethods((store, service = inject(IndexesService)) => ({
    async loadIndexes(projectId: string, tableId: string, search?: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const response = await service.list(projectId, tableId, search);
        patchState(store, { indexes: response.indexes.filter((index) => !index.deletedAt) });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async loadIndex(projectId: string, tableId: string, indexId: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const index = await service.get(projectId, tableId, indexId);
        patchState(store, { currentIndex: index });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async create(
      projectId: string,
      tableId: string,
      input: CreateIndexInput,
    ): Promise<IndexSummary> {
      patchState(store, { isLoading: true });
      try {
        const index = await service.create(projectId, tableId, input);
        patchState(store, { currentIndex: index, indexes: [...store.indexes(), index] });
        return index;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async update(
      projectId: string,
      tableId: string,
      indexId: string,
      input: UpdateIndexInput,
    ): Promise<IndexSummary> {
      patchState(store, { isLoading: true });
      try {
        const index = await service.update(projectId, tableId, indexId, input);
        patchState(store, {
          currentIndex: index,
          indexes: store.indexes().map((item) => (item.id === indexId ? index : item)),
        });
        return index;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async delete(projectId: string, tableId: string, indexId: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await service.archive(projectId, tableId, indexId);
        patchState(store, {
          currentIndex: store.currentIndex()?.id === indexId ? null : store.currentIndex(),
          indexes: store.indexes().filter((item) => item.id !== indexId),
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    clearCurrentIndex(): void {
      patchState(store, { currentIndex: null });
    },
  })),
);
