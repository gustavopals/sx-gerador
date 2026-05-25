import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  PoButtonModule,
  PoFieldModule,
  PoNotificationService,
  type PoSelectOption,
} from '@po-ui/ng-components';
import {
  HistoryService,
  mapHistoryError,
  type HistoryEntry,
} from '../../../core/services/history.service';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'sxg-history-timeline',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PoButtonModule,
    PoFieldModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './history-timeline.component.html',
  styleUrl: './history-timeline.component.scss',
})
export class HistoryTimelineComponent implements OnInit {
  private readonly historyService = inject(HistoryService);
  private readonly notification = inject(PoNotificationService);
  private readonly fb = inject(FormBuilder);

  readonly projectId = input.required<string>();
  readonly tablePrefix = input<string | undefined>(undefined);

  readonly loaded = output<number>();

  readonly isLoading = signal(false);
  readonly entries = signal<HistoryEntry[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly operationOptions: PoSelectOption[] = [
    { label: 'Todas as operações', value: '' },
    { label: 'CREATE_TABLE', value: 'CREATE_TABLE' },
    { label: 'ALTER_TABLE', value: 'ALTER_TABLE' },
    { label: 'DROP_TABLE', value: 'DROP_TABLE' },
    { label: 'CREATE_FIELD', value: 'CREATE_FIELD' },
    { label: 'ALTER_FIELD', value: 'ALTER_FIELD' },
    { label: 'DROP_FIELD', value: 'DROP_FIELD' },
    { label: 'CREATE_INDEX', value: 'CREATE_INDEX' },
    { label: 'ALTER_INDEX', value: 'ALTER_INDEX' },
    { label: 'DROP_INDEX', value: 'DROP_INDEX' },
  ];

  readonly filtersForm = this.fb.group({
    operation: [''],
  });

  ngOnInit(): void {
    void this.load();
  }

  get hasPreviousPage(): boolean {
    return this.page() > 1;
  }

  get hasNextPage(): boolean {
    return this.page() < this.totalPages();
  }

  async applyFilters(): Promise<void> {
    this.page.set(1);
    await this.load();
  }

  async previousPage(): Promise<void> {
    if (!this.hasPreviousPage) return;
    this.page.update((p) => p - 1);
    await this.load();
  }

  async nextPage(): Promise<void> {
    if (!this.hasNextPage) return;
    this.page.update((p) => p + 1);
    await this.load();
  }

  authorLabel(entry: HistoryEntry): string {
    return entry.authorName ?? entry.authorEmail ?? entry.authorId;
  }

  trackEntry(_: number, entry: HistoryEntry): string {
    return entry.id;
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      const operation = this.filtersForm.value.operation?.trim();
      const response = await this.historyService.listProjectHistory(this.projectId(), {
        page: this.page(),
        pageSize: 20,
        operation: operation || undefined,
        tablePrefix: this.tablePrefix(),
      });
      this.entries.set(response.entries);
      this.total.set(response.meta.total);
      this.totalPages.set(response.meta.totalPages);
      this.loaded.emit(response.meta.total);
    } catch (err) {
      this.notification.error(mapHistoryError(err));
    } finally {
      this.isLoading.set(false);
    }
  }
}
