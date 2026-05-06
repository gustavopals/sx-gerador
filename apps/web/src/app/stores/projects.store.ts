import { computed, inject } from '@angular/core';
import type { CreateProjectInput, UpdateProjectInput } from '@sxgerador/shared-types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  ProjectsService,
  type ListProjectsParams,
  type ProjectsListMeta,
  type ProjectSummary,
} from '../core/services/projects.service';

interface ProjectsState {
  projects: ProjectSummary[];
  currentProject: ProjectSummary | null;
  meta: ProjectsListMeta | null;
  isLoading: boolean;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  meta: null,
  isLoading: false,
};

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isEmpty: computed(() => !store.isLoading() && store.projects().length === 0),
    totalPages: computed(() => store.meta()?.totalPages ?? 0),
    total: computed(() => store.meta()?.total ?? 0),
  })),
  withMethods((store, service = inject(ProjectsService)) => ({
    async loadProjects(params: ListProjectsParams = {}): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const { projects, meta } = await service.list(params);
        patchState(store, { projects, meta });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async loadProject(id: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const project = await service.get(id);
        patchState(store, { currentProject: project });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async create(input: CreateProjectInput): Promise<ProjectSummary> {
      patchState(store, { isLoading: true });
      try {
        const project = await service.create(input);
        patchState(store, {
          currentProject: project,
          projects: [project, ...store.projects()],
        });
        return project;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async update(id: string, input: UpdateProjectInput): Promise<ProjectSummary> {
      patchState(store, { isLoading: true });
      try {
        const project = await service.update(id, input);
        patchState(store, {
          currentProject: project,
          projects: store.projects().map((p) => (p.id === id ? project : p)),
        });
        return project;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async delete(id: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const project = await service.archive(id);
        patchState(store, {
          currentProject: store.currentProject()?.id === id ? project : store.currentProject(),
          projects: store.projects().map((p) => (p.id === id ? project : p)),
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async restore(id: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const project = await service.restore(id);
        patchState(store, {
          currentProject: store.currentProject()?.id === id ? project : store.currentProject(),
          projects: store.projects().map((p) => (p.id === id ? project : p)),
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async duplicate(id: string): Promise<ProjectSummary> {
      patchState(store, { isLoading: true });
      try {
        const copy = await service.duplicate(id);
        patchState(store, {
          currentProject: copy,
          projects: [copy, ...store.projects()],
        });
        return copy;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    clearCurrentProject(): void {
      patchState(store, { currentProject: null });
    },
  })),
);
